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
    const message = error instanceof Error ? error.message : "알 수 없는 오류";

    return NextResponse.json({
      ok: true,
      result: createSafeFailureResult(
        query,
        `분석 중 문제가 발생했어요. 잠시 후 다시 시도하거나 리뷰를 붙여넣어 분석해주세요. 오류: ${message}`
      )
    });
  }
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
    recommendedFor: stringListOr(value.recommendedFor, sample.recommendedFor),
    cautionFor: stringListOr(value.cautionFor, sample.cautionFor),
    pros: stringListOr(value.pros, sample.pros),
    cons: stringListOr(value.cons, sample.cons),
    adSignals: stringListOr(value.adSignals, sample.adSignals),
    checklist: stringListOr(value.checklist, sample.checklist),
    sources: sources.map((source: Partial<ReviewAnalysisResult["sources"][number]>) => ({
      title: stringOr(source.title, "출처 제목 없음"),
      url: stringOr(source.url, ""),
      type: sourceTypeOrUnknown(source.type),
      reliabilityNote: stringOr(source.reliabilityNote, "출처 신뢰도 설명이 부족합니다.")
    })),
    needsUserReviews:
      typeof value.needsUserReviews === "boolean"
        ? value.needsUserReviews
        : mode === "web" && sources.length < 3,
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
