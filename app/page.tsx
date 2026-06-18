"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ClipboardPaste,
  Link,
  Loader2,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import type { AnalyzeResponse, ReviewAnalysisResult, ReviewScore } from "@/lib/analysis/schema";

const loadingSteps = [
  "제품 정보 확인 중",
  "공개 웹 후기 검색 중",
  "광고성 리뷰 패턴 확인 중",
  "찐 후기 요약 중"
];

const examples = ["다이슨 에어랩", "로보락 S8 MaxV Ultra", "아이폰 16 케이스"];

export default function Home() {
  const [query, setQuery] = useState("");
  const [pastedReviews, setPastedReviews] = useState("");
  const [result, setResult] = useState<ReviewAnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [showSources, setShowSources] = useState(false);

  const needsFallback = Boolean(result?.needsUserReviews && result.mode !== "pasted");

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    const timer = window.setInterval(() => {
      setLoadingStep((current) => (current + 1) % loadingSteps.length);
    }, 1100);

    return () => window.clearInterval(timer);
  }, [isLoading]);

  const sourceCountLabel = useMemo(() => {
    const count = result?.sources.length ?? 0;
    return count > 0 ? `${count}개 출처` : "출처 부족";
  }, [result]);

  async function analyze(nextQuery = query, nextPastedReviews = "") {
    const trimmedQuery = nextQuery.trim();
    const trimmedReviews = nextPastedReviews.trim();

    if (!trimmedQuery) {
      setError("제품명 또는 상품 URL을 입력해주세요.");
      return;
    }

    setError("");
    setLoadingStep(0);
    setIsLoading(true);
    setShowSources(false);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: trimmedQuery,
          pastedReviews: trimmedReviews || undefined
        })
      });

      const data = (await response.json()) as AnalyzeResponse;

      if (!response.ok || !data.ok) {
        setError(data.ok ? "분석에 실패했어요." : data.message);
        return;
      }

      setResult(data.result);
    } catch {
      setError("분석 요청을 보내지 못했어요. 네트워크 상태를 확인해주세요.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void analyze(query);
  }

  function handlePasteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void analyze(query, pastedReviews);
  }

  function reset() {
    setQuery("");
    setPastedReviews("");
    setResult(null);
    setError("");
    setLoadingStep(0);
    setShowSources(false);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#d8f0e5_0,#f7faf6_34%,#f1f5f9_100%)] px-4 py-6 text-[#161914] sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-5xl flex-col">
        <header className="flex items-center justify-between gap-3 py-3">
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-semibold text-[#161914] transition hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-[#2f6f62]"
            aria-label="처음 화면으로 이동"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-[#161914] text-white">
              <ShieldCheck size={19} strokeWidth={2.2} />
            </span>
            <span className="text-lg">찐 후기</span>
          </button>
          <span className="hidden text-sm text-[#53615c] sm:block">{sourceCountLabel}</span>
        </header>

        <section className="flex flex-1 flex-col justify-center gap-8 py-8">
          <div className="mx-auto w-full max-w-3xl text-center">
            <h1 className="text-balance text-4xl font-bold leading-tight tracking-normal text-[#151713] sm:text-5xl">
              찐 후기
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-7 text-[#4d5a55] sm:text-lg">
              광고성 리뷰는 걷어내고, 구매에 도움 되는 후기만 정리해드려요.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mx-auto w-full max-w-3xl rounded-lg border border-[#d9e2dc] bg-white p-2 shadow-[0_22px_70px_rgba(28,45,36,0.12)]"
          >
            <label htmlFor="product-query" className="sr-only">
              제품명 또는 상품 URL
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex min-h-14 flex-1 items-center gap-3 rounded-md bg-[#f7faf6] px-4">
                <Search className="shrink-0 text-[#587069]" size={20} />
                <input
                  id="product-query"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="제품명 또는 상품 URL을 입력해주세요"
                  className="h-12 min-w-0 flex-1 bg-transparent text-base text-[#161914] outline-none placeholder:text-[#7b8982]"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-[#1f6b5b] px-5 text-sm font-bold text-white transition hover:bg-[#185447] focus:outline-none focus:ring-2 focus:ring-[#2f6f62] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#91aaa1]"
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                후기 분석하기
              </button>
            </div>
            {error ? <p className="px-2 pt-3 text-left text-sm font-medium text-[#b42318]">{error}</p> : null}
          </form>

          {!result && !isLoading ? (
            <div className="mx-auto flex w-full max-w-3xl flex-wrap justify-center gap-2">
              {examples.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => {
                    setQuery(example);
                    void analyze(example);
                  }}
                  className="rounded-lg border border-[#d7e0db] bg-white/72 px-3 py-2 text-sm font-medium text-[#53615c] transition hover:border-[#1f6b5b] hover:text-[#1f6b5b] focus:outline-none focus:ring-2 focus:ring-[#2f6f62]"
                >
                  {example}
                </button>
              ))}
            </div>
          ) : null}

          {isLoading ? <LoadingState step={loadingSteps[loadingStep]} /> : null}

          {result ? (
            <div className="mx-auto grid w-full max-w-5xl gap-4 lg:grid-cols-[1fr_320px]">
              <section className="rounded-lg border border-[#d9e2dc] bg-white p-5 shadow-[0_18px_60px_rgba(28,45,36,0.1)] sm:p-6">
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#1f6b5b]">{result.productName}</p>
                    <h2 className="mt-2 text-pretty text-2xl font-bold leading-snug text-[#161914]">
                      {result.headline}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-[#52615b]">{result.summary}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <ScoreMeter score={result.scores.authenticity} tone="good" />
                    <ScoreMeter score={result.scores.adSuspicion} tone="warning" />
                    <ScoreMeter score={result.scores.purchaseSatisfaction} tone="steady" />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <InsightPanel
                      title="이런 사람에게 추천"
                      icon={<CheckCircle2 size={18} />}
                      items={result.recommendedFor}
                    />
                    <InsightPanel
                      title="이런 사람은 주의"
                      icon={<AlertTriangle size={18} />}
                      items={result.cautionFor}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <ListBlock title="반복된 장점" items={result.pros} />
                    <ListBlock title="반복된 단점" items={result.cons} />
                  </div>

                  <ListBlock title="광고 의심 패턴" items={result.adSignals} variant="warning" />
                  <ListBlock title="구매 전 체크포인트" items={result.checklist} variant="check" />

                  <div className="rounded-lg border border-[#d9e2dc]">
                    <button
                      type="button"
                      onClick={() => setShowSources((current) => !current)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left text-sm font-bold text-[#26332f] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#2f6f62]"
                      aria-expanded={showSources}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Link size={17} />
                        참고한 출처
                      </span>
                      <ChevronDown
                        className={`shrink-0 transition ${showSources ? "rotate-180" : ""}`}
                        size={18}
                      />
                    </button>
                    {showSources ? (
                      <div className="border-t border-[#d9e2dc] px-4 py-3">
                        {result.sources.length > 0 ? (
                          <ul className="space-y-3">
                            {result.sources.map((source, index) => (
                              <li key={`${source.url}-${index}`} className="text-sm leading-6">
                                <a
                                  href={source.url || "#"}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-semibold text-[#1f6b5b] underline-offset-4 hover:underline"
                                >
                                  {source.title}
                                </a>
                                <p className="text-[#5c6863]">{source.reliabilityNote}</p>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-[#5c6863]">표시할 출처가 부족합니다.</p>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>

              <aside className="space-y-4">
                <div className="rounded-lg border border-[#d9e2dc] bg-white p-5 shadow-[0_18px_60px_rgba(28,45,36,0.08)]">
                  <p className="text-sm font-bold text-[#26332f]">분석 상태</p>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-[#62716b]">분석 모드</dt>
                      <dd className="font-semibold text-[#1f6b5b]">
                        {result.mode === "pasted" ? "붙여넣기" : "공개 웹"}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-[#62716b]">제품군</dt>
                      <dd className="text-right font-semibold text-[#26332f]">{result.category}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-[#62716b]">출처</dt>
                      <dd className="font-semibold text-[#26332f]">{sourceCountLabel}</dd>
                    </div>
                  </dl>
                </div>

                {needsFallback ? (
                  <form
                    onSubmit={handlePasteSubmit}
                    className="rounded-lg border border-[#d8b16a] bg-[#fffaf0] p-5 shadow-[0_18px_60px_rgba(109,78,28,0.1)]"
                  >
                    <div className="flex items-start gap-3">
                      <ClipboardPaste className="mt-0.5 shrink-0 text-[#9a6412]" size={20} />
                      <div>
                        <p className="font-bold text-[#6f4610]">웹 후기가 부족해요</p>
                        <p className="mt-2 text-sm leading-6 text-[#76521d]">
                          웹에서 충분한 후기를 찾지 못했어요. 가지고 있는 리뷰를 붙여넣으면 같은
                          기준으로 분석해드릴게요.
                        </p>
                      </div>
                    </div>
                    <label htmlFor="pasted-reviews" className="sr-only">
                      리뷰 붙여넣기
                    </label>
                    <textarea
                      id="pasted-reviews"
                      value={pastedReviews}
                      onChange={(event) => setPastedReviews(event.target.value)}
                      placeholder="리뷰 여러 개를 그대로 붙여넣어주세요"
                      className="mt-4 min-h-36 w-full resize-y rounded-md border border-[#e0c58e] bg-white px-3 py-3 text-sm leading-6 outline-none transition placeholder:text-[#9c8351] focus:border-[#9a6412] focus:ring-2 focus:ring-[#edcf91]"
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !pastedReviews.trim()}
                      className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#9a6412] px-4 text-sm font-bold text-white transition hover:bg-[#7f500f] focus:outline-none focus:ring-2 focus:ring-[#9a6412] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#c7ae7b]"
                    >
                      <Send size={17} />
                      붙여넣은 리뷰 분석하기
                    </button>
                  </form>
                ) : null}

                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-[#c9d5cf] bg-white px-4 text-sm font-bold text-[#26332f] transition hover:border-[#1f6b5b] hover:text-[#1f6b5b] focus:outline-none focus:ring-2 focus:ring-[#2f6f62]"
                >
                  <RefreshCw size={17} />
                  새 제품 분석하기
                </button>
              </aside>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function LoadingState({ step }: { step: string }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl items-center gap-3 rounded-lg border border-[#d9e2dc] bg-white px-5 py-4 text-sm font-semibold text-[#26332f] shadow-[0_16px_48px_rgba(28,45,36,0.08)]">
      <Loader2 className="shrink-0 animate-spin text-[#1f6b5b]" size={20} />
      <span>{step}</span>
    </div>
  );
}

function ScoreMeter({ score, tone }: { score: ReviewScore; tone: "good" | "warning" | "steady" }) {
  const color =
    tone === "good" ? "bg-[#1f6b5b]" : tone === "warning" ? "bg-[#c0741f]" : "bg-[#345f88]";

  return (
    <div className="rounded-lg border border-[#d9e2dc] bg-[#fbfdfb] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#26332f]">{score.label}</p>
          <p className="mt-1 text-xs leading-5 text-[#64736c]">{score.description}</p>
        </div>
        <strong className="shrink-0 text-2xl text-[#161914]">{score.value}</strong>
      </div>
      <div className="mt-4 h-2 rounded-full bg-[#e4ebe7]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score.value}%` }} />
      </div>
    </div>
  );
}

function InsightPanel({
  title,
  icon,
  items
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
}) {
  return (
    <div className="rounded-lg border border-[#d9e2dc] bg-[#fbfdfb] p-4">
      <h3 className="flex items-center gap-2 text-sm font-bold text-[#26332f]">
        <span className="text-[#1f6b5b]">{icon}</span>
        {title}
      </h3>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-[#52615b]">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function ListBlock({
  title,
  items,
  variant = "default"
}: {
  title: string;
  items: string[];
  variant?: "default" | "warning" | "check";
}) {
  const marker =
    variant === "warning" ? "bg-[#c0741f]" : variant === "check" ? "bg-[#345f88]" : "bg-[#1f6b5b]";

  return (
    <section className="rounded-lg border border-[#d9e2dc] bg-white p-4">
      <h3 className="text-sm font-bold text-[#26332f]">{title}</h3>
      <ul className="mt-3 space-y-3 text-sm leading-6 text-[#52615b]">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span className={`mt-2 size-1.5 shrink-0 rounded-full ${marker}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
