export type AnalyzeRequest = {
  query: string;
  pastedReviews?: string;
};

export type ReviewScore = {
  label: string;
  value: number;
  description: string;
};

export type ReviewSource = {
  title: string;
  url: string;
  type: "blog" | "community" | "article" | "commerce" | "unknown";
  reliabilityNote: string;
};

export type ReviewAnalysisResult = {
  productName: string;
  category: string;
  headline: string;
  summary: string;
  scores: {
    authenticity: ReviewScore;
    adSuspicion: ReviewScore;
    purchaseSatisfaction: ReviewScore;
  };
  recommendedFor: string[];
  cautionFor: string[];
  pros: string[];
  cons: string[];
  adSignals: string[];
  checklist: string[];
  sources: ReviewSource[];
  needsUserReviews: boolean;
  mode: "web" | "pasted" | "sample";
};

export type AnalyzeResponse =
  | {
      ok: true;
      result: ReviewAnalysisResult;
    }
  | {
      ok: false;
      message: string;
    };

export const scoreLabels = {
  authenticity: "찐 후기 신뢰도",
  adSuspicion: "광고 의심도",
  purchaseSatisfaction: "구매 만족도"
} as const;

export function clampScore(value: unknown, fallback: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

export function createSampleResult(query: string, hasPastedReviews = false): ReviewAnalysisResult {
  const trimmedQuery = query.trim() || "샘플 제품";

  return {
    productName: trimmedQuery,
    category: "자동 추론 예정",
    headline: hasPastedReviews
      ? "붙여넣은 리뷰 기준으로는 장점이 분명하지만, 반복 표현이 있어 광고성 여부를 함께 확인해야 해요."
      : "공개 웹 후기 기준으로는 실사용 만족도가 보이지만, 근거가 충분하지 않아 추가 리뷰 확인을 권장해요.",
    summary: hasPastedReviews
      ? "사용자가 제공한 리뷰에는 구체적인 사용 맥락과 반복되는 장단점이 함께 보입니다. 다만 일부 문장은 홍보 문구처럼 표현이 과하게 정돈되어 있어 광고 의심 신호로 분리했습니다."
      : "이 결과는 개발 환경에서 UI 확인을 위한 샘플입니다. 실제 OpenAI API 키가 연결되면 공개 웹 검색 결과와 출처를 바탕으로 분석합니다.",
    scores: {
      authenticity: {
        label: scoreLabels.authenticity,
        value: hasPastedReviews ? 68 : 54,
        description: "구체적 사용 맥락, 단점 언급, 출처 다양성을 함께 반영한 점수"
      },
      adSuspicion: {
        label: scoreLabels.adSuspicion,
        value: hasPastedReviews ? 42 : 58,
        description: "협찬 문구, 반복적인 극찬, 구매 유도 표현 가능성"
      },
      purchaseSatisfaction: {
        label: scoreLabels.purchaseSatisfaction,
        value: hasPastedReviews ? 73 : 61,
        description: "후기에서 반복적으로 나타나는 만족/불만 패턴"
      }
    },
    recommendedFor: [
      "빠른 결론보다 장단점 근거를 같이 보고 싶은 사람",
      "광고성 리뷰와 실사용 후기를 구분해 구매 판단을 하고 싶은 사람"
    ],
    cautionFor: [
      "공개 웹 후기가 적은 신제품을 바로 구매하려는 사람",
      "AS, 내구성, 장기 사용감이 중요한 고가 제품 구매자"
    ],
    pros: [
      "긍정 리뷰에서는 사용 편의성과 첫인상 만족이 반복적으로 언급됩니다.",
      "구매 직후 체감되는 장점은 비교적 명확하게 드러납니다."
    ],
    cons: [
      "장기 사용 후 내구성이나 유지 비용에 대한 근거는 아직 부족합니다.",
      "일부 리뷰는 단점 없이 장점만 나열해 신뢰도를 낮춥니다."
    ],
    adSignals: [
      "구체적인 사용 상황 없이 '강력 추천', '무조건 구매' 같은 표현이 반복됩니다.",
      "가격/구매처 유도 문구가 후기보다 앞서는 글은 낮은 신뢰도로 봅니다."
    ],
    checklist: [
      "장기 사용 후기가 있는지 확인하기",
      "단점이 구체적으로 적힌 리뷰를 우선해서 보기",
      "동일한 문구가 여러 출처에 반복되는지 확인하기",
      "가격 비교보다 AS와 환불 조건도 함께 확인하기"
    ],
    sources: [
      {
        title: "개발용 샘플 출처",
        url: "https://example.com/review",
        type: "unknown",
        reliabilityNote: "실제 API 연결 전 UI 확인을 위한 샘플 출처입니다."
      }
    ],
    needsUserReviews: !hasPastedReviews,
    mode: hasPastedReviews ? "pasted" : "sample"
  };
}

export function createSafeFailureResult(
  query: string,
  reason: string,
  mode: ReviewAnalysisResult["mode"] = "sample"
): ReviewAnalysisResult {
  return {
    ...createSampleResult(query, false),
    headline: "분석 결과를 안정적으로 만들지 못했어요. 리뷰를 붙여넣으면 같은 기준으로 다시 분석할 수 있어요.",
    summary: reason,
    scores: {
      authenticity: {
        label: scoreLabels.authenticity,
        value: 0,
        description: "분석 실패로 점수를 계산하지 못했습니다."
      },
      adSuspicion: {
        label: scoreLabels.adSuspicion,
        value: 0,
        description: "분석 실패로 점수를 계산하지 못했습니다."
      },
      purchaseSatisfaction: {
        label: scoreLabels.purchaseSatisfaction,
        value: 0,
        description: "분석 실패로 점수를 계산하지 못했습니다."
      }
    },
    recommendedFor: ["분석이 정상 완료된 뒤 추천 대상을 다시 확인해주세요."],
    cautionFor: ["API 설정이나 사용량 제한 문제가 해결되기 전에는 결과를 구매 판단에 사용하지 마세요."],
    pros: ["분석 실패로 반복 장점을 확인하지 못했습니다."],
    cons: ["분석 실패로 반복 단점을 확인하지 못했습니다."],
    adSignals: ["분석 실패로 광고 의심 패턴을 확인하지 못했습니다."],
    checklist: [
      "잠시 후 다시 분석하기",
      "API 사용량과 결제 상태 확인하기",
      "보유한 리뷰를 붙여넣어 다시 시도하기"
    ],
    sources: [],
    needsUserReviews: true,
    mode
  };
}
