import type { AnalyzeRequest } from "./schema";

export const analysisJsonShape = {
  productName: "string",
  category: "string",
  headline: "string",
  summary: "string",
  scores: {
    authenticity: {
      label: "찐 후기 신뢰도",
      value: "0부터 100 사이 숫자",
      description: "string"
    },
    adSuspicion: {
      label: "광고 의심도",
      value: "0부터 100 사이 숫자",
      description: "string"
    },
    purchaseSatisfaction: {
      label: "구매 만족도",
      value: "0부터 100 사이 숫자",
      description: "string"
    }
  },
  recommendedFor: ["string"],
  cautionFor: ["string"],
  pros: ["string"],
  cons: ["string"],
  adSignals: ["string"],
  checklist: ["string"],
  sources: [
    {
      title: "string",
      url: "string",
      type: "blog | community | article | commerce | unknown",
      reliabilityNote: "string"
    }
  ],
  needsUserReviews: "boolean",
  mode: "web | pasted"
};

export function buildAnalysisPrompt(request: AnalyzeRequest) {
  const query = request.query.trim();
  const pastedReviews = request.pastedReviews?.trim();
  const hasPastedReviews = Boolean(pastedReviews);

  return [
    "너는 제품 리뷰 신뢰도 분석가다.",
    "사용자에게 보여줄 최종 결과는 반드시 한국어로 작성한다.",
    "특정 리뷰어, 판매자, 브랜드가 사기라고 단정하지 않는다.",
    "확인 가능한 근거를 정리하고, 광고 가능성은 '의심 신호'로만 표현한다.",
    "사용자가 붙여넣은 리뷰가 있으면 그 텍스트를 우선 분석한다.",
    "붙여넣은 리뷰가 없으면 공개 웹에서 찾은 후기성 근거를 바탕으로 분석한다.",
    "후기 근거가 부족하면 억지로 결론을 만들지 말고 needsUserReviews를 true로 설정한다.",
    "반드시 JSON 객체만 반환한다. 마크다운 코드블록이나 설명 문장을 붙이지 않는다.",
    `분석 모드: ${hasPastedReviews ? "붙여넣은 리뷰 분석" : "공개 웹 후기 검색 분석"}`,
    `사용자 입력: ${query}`,
    hasPastedReviews ? `붙여넣은 리뷰:\n${pastedReviews}` : "",
    "판단 기준:",
    "- 실사용 맥락, 장기 사용, 구체적 단점, 비교 경험, 사용 환경이 있으면 신뢰도를 높인다.",
    "- 협찬/체험단/파트너스/구매 유도/반복 극찬/단점 부재/스펙 나열 위주 글은 광고 의심도를 높인다.",
    "- 공개 웹 근거는 출처 제목과 URL을 sources에 포함한다.",
    "- 출처가 3개 미만이거나 후기성이 약하면 needsUserReviews를 true로 둔다.",
    `반환 JSON 형태:\n${JSON.stringify(analysisJsonShape, null, 2)}`
  ]
    .filter(Boolean)
    .join("\n\n");
}
