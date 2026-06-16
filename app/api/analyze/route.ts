import { NextResponse } from "next/server";
import OpenAI from "openai";
import { buildAnalysisPrompt } from "@/lib/analysis/prompt";
import {
  AnalyzeRequest,
  ReviewAnalysisResult,
  ReviewSource,
  clampScore,
  createSafeFailureResult,
  createSampleResult,
  scoreLabels
} from "@/lib/analysis/schema";

const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

export async function POST(request: Request) {
  let body: AnalyzeRequest;

  try {
    body = (await request.json()) as AnalyzeRequest;
  } catch {
    return NextResponse.json(
      { ok: false, message: "요청 본문을 읽지 못했어요." },
      { status: 400 }
    );
  }

  const query = body.query?.trim();
  const pastedReviews = body.pastedReviews?.trim();

  if (!query) {
    return NextResponse.json(
      { ok: false, message: "제품명 또는 상품 URL을 입력해주세요." },
      { status: 400 }
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      ok: true,
      result: createSampleResult(query, Boolean(pastedReviews))
    });
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  try {
    const prompt = buildAnalysisPrompt({ query, pastedReviews });
    const shouldSearchWeb = !pastedReviews;

    const response = await client.responses.create({
      model,
      input: prompt,
      ...(shouldSearchWeb
        ? {
            tools: [{ type: "web_search", search_context_size: "low" }],
            tool_choice: "required"
          }
        : {})
    } as Parameters<typeof client.responses.create>[0]);

    const text = getResponseText(response);
    const parsed = parseModelJson(text);
    const normalized = normalizeResult(parsed, query, pastedReviews ? "pasted" : "web");

    return NextResponse.json({
      ok: true,
      result: normalized
    });
  } catch (error) {
    const message = getFriendlyErrorMessage(error);

    return NextResponse.json({
      ok: true,
      result: createSafeFailureResult(
        query,
        message,
        pastedReviews ? "pasted" : "web"
      )
    });
  }
}

function getFriendlyErrorMessage(error: unknown) {
  const raw = error instanceof Error ? error.message : "";

  if (raw.includes("429") || raw.toLowerCase().includes("quota")) {
    return "OpenAI API 사용량 또는 결제 한도 때문에 분석을 완료하지 못했어요. 프로젝트 사용량과 결제 상태를 확인한 뒤 다시 시도해주세요.";
  }

  if (raw.toLowerCase().includes("api key")) {
    return "OpenAI API 키 설정을 확인해야 해요. 키가 올바르게 저장되어 있는지 확인한 뒤 다시 시도해주세요.";
  }

  return "분석 중 문제가 발생했어요. 잠시 후 다시 시도하거나 리뷰를 붙여넣어 분석해주세요.";
}

function parseModelJson(text: string) {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new Error("모델 응답에서 JSON 객체를 찾지 못했습니다.");
    }

    return JSON.parse(match[0]);
  }
}

function getResponseText(response: unknown) {
  if (
    typeof response === "object" &&
    response !== null &&
    "output_text" in response &&
    typeof response.output_text === "string"
  ) {
    return response.output_text;
  }

  throw new Error("모델 응답 텍스트를 읽지 못했습니다.");
}

function normalizeResult(
  value: Partial<ReviewAnalysisResult>,
  query: string,
  mode: "web" | "pasted"
): ReviewAnalysisResult {
  const sample = createSampleResult(query, mode === "pasted");
  const scores = value.scores ?? sample.scores;
  const sources = Array.isArray(value.sources) ? value.sources : [];
  const needsUserReviews =
    typeof value.needsUserReviews === "boolean"
      ? value.needsUserReviews
      : mode === "web" && sources.length < 3;
  const weakEvidenceFallback = {
    recommendedFor: ["공개 웹 근거가 부족해 추천 대상을 단정하기 어려워요."],
    cautionFor: ["후기 수가 적은 상태에서 바로 구매를 결정하려는 사람은 추가 확인이 필요해요."],
    pros: ["공개 웹 근거가 부족해 반복된 장점을 확인하지 못했어요."],
    cons: ["공개 웹 근거가 부족해 반복된 단점을 확인하지 못했어요."],
    adSignals: ["출처와 후기 수가 부족해 광고 의심 패턴을 안정적으로 분리하지 못했어요."],
    checklist: [
      "사용자 리뷰를 추가로 붙여넣어 다시 분석하기",
      "장기 사용 후기가 있는지 확인하기",
      "단점이 구체적으로 적힌 리뷰를 우선해서 보기"
    ]
  };

  return {
    productName: stringOr(value.productName, sample.productName),
    category: stringOr(value.category, sample.category),
    headline: stringOr(value.headline, sample.headline),
    summary: stringOr(value.summary, sample.summary),
    scores: {
      authenticity: {
        label: scoreLabels.authenticity,
        value: clampScore(scores.authenticity?.value, sample.scores.authenticity.value),
        description: stringOr(
          scores.authenticity?.description,
          sample.scores.authenticity.description
        )
      },
      adSuspicion: {
        label: scoreLabels.adSuspicion,
        value: clampScore(scores.adSuspicion?.value, sample.scores.adSuspicion.value),
        description: stringOr(scores.adSuspicion?.description, sample.scores.adSuspicion.description)
      },
      purchaseSatisfaction: {
        label: scoreLabels.purchaseSatisfaction,
        value: clampScore(
          scores.purchaseSatisfaction?.value,
          sample.scores.purchaseSatisfaction.value
        ),
        description: stringOr(
          scores.purchaseSatisfaction?.description,
          sample.scores.purchaseSatisfaction.description
        )
      }
    },
    recommendedFor: stringListOr(
      value.recommendedFor,
      needsUserReviews ? weakEvidenceFallback.recommendedFor : sample.recommendedFor
    ),
    cautionFor: stringListOr(
      value.cautionFor,
      needsUserReviews ? weakEvidenceFallback.cautionFor : sample.cautionFor
    ),
    pros: stringListOr(value.pros, needsUserReviews ? weakEvidenceFallback.pros : sample.pros),
    cons: stringListOr(value.cons, needsUserReviews ? weakEvidenceFallback.cons : sample.cons),
    adSignals: stringListOr(
      value.adSignals,
      needsUserReviews ? weakEvidenceFallback.adSignals : sample.adSignals
    ),
    checklist: stringListOr(
      value.checklist,
      needsUserReviews ? weakEvidenceFallback.checklist : sample.checklist
    ),
    sources: sources.map((source: Partial<ReviewAnalysisResult["sources"][number]>) => ({
      title: stringOr(source.title, "출처 제목 없음"),
      url: stringOr(source.url, ""),
      type: sourceTypeOrUnknown(source.type),
      reliabilityNote: stringOr(source.reliabilityNote, "출처 신뢰도 설명이 부족합니다.")
    })),
    needsUserReviews,
    mode
  };
}

function stringOr(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function sourceTypeOrUnknown(value: unknown): ReviewSource["type"] {
  return value === "blog" ||
    value === "community" ||
    value === "article" ||
    value === "commerce" ||
    value === "unknown"
    ? value
    : "unknown";
}

function stringListOr(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()));

  return items.length > 0 ? items.map((item) => item.trim()) : fallback;
}
