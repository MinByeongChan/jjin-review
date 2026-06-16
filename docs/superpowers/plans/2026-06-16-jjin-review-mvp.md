# 찐 후기 MVP 구현 계획

> **agentic worker용 필수 안내:** 이 계획을 작업 단위로 실행할 때는 `superpowers:subagent-driven-development` 또는 `superpowers:executing-plans`를 사용한다. 각 단계는 체크박스(`- [ ]`)로 추적한다.

**목표:** 사용자가 제품명 또는 URL을 입력하면 공개 웹 후기 기반 분석 결과를 보여주고, 근거가 부족하면 리뷰 붙여넣기 분석으로 이어지는 Next.js MVP를 만든다.

**아키텍처:** 단일 Next.js 페이지에서 입력, 로딩, 결과, 보완 입력 상태를 관리한다. 서버 API 라우트는 OpenAI Responses API를 호출하고 UI가 믿고 렌더링할 수 있는 JSON 계약을 반환한다. 분석 타입, 프롬프트, 개발용 샘플 결과는 `lib/analysis`에 분리한다.

**기술 스택:** Next.js, React, TypeScript, Tailwind CSS, OpenAI JavaScript SDK, lucide-react.

---

## 파일 구조

- `package.json`: 프로젝트 스크립트와 의존성
- `next.config.ts`: Next.js 설정
- `tsconfig.json`: TypeScript 설정
- `postcss.config.mjs`: Tailwind/PostCSS 설정
- `eslint.config.mjs`: ESLint 설정
- `.gitignore`: 로컬 산출물과 환경 파일 제외
- `.env.example`: `OPENAI_API_KEY` 안내
- `app/layout.tsx`: 메타데이터와 전역 레이아웃
- `app/globals.css`: Tailwind import, 전역 테마, 반응형/포커스 스타일
- `app/page.tsx`: 제품 입력, 로딩, 결과, 출처 접기, 리뷰 붙여넣기 UI
- `app/api/analyze/route.ts`: 웹 검색 분석과 붙여넣기 분석을 처리하는 서버 API
- `lib/analysis/schema.ts`: 요청/응답 타입, 점수 라벨, 개발용 결과 생성 함수
- `lib/analysis/prompt.ts`: OpenAI 프롬프트와 JSON 출력 지침

## 작업 목록

### 작업 1: Next.js 앱 스캐폴딩

**파일:**

- 생성: `package.json`
- 생성: `next.config.ts`
- 생성: `tsconfig.json`
- 생성: `postcss.config.mjs`
- 생성: `eslint.config.mjs`
- 생성: `.gitignore`
- 생성: `.env.example`
- 생성: `app/layout.tsx`
- 생성: `app/globals.css`
- 생성: `app/page.tsx`

- [ ] **1단계: 의존성과 스크립트 추가**

`package.json`을 생성한다.

```json
{
  "name": "jjin-review",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@tailwindcss/postcss": "latest",
    "lucide-react": "latest",
    "next": "latest",
    "openai": "latest",
    "react": "latest",
    "react-dom": "latest",
    "tailwindcss": "latest"
  },
  "devDependencies": {
    "@eslint/eslintrc": "latest",
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "eslint": "latest",
    "eslint-config-next": "latest",
    "typescript": "latest"
  }
}
```

- [ ] **2단계: 프레임워크 설정 추가**

`next.config.ts`를 생성한다.

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

`tsconfig.json`을 생성한다.

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`postcss.config.mjs`를 생성한다.

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {}
  }
};

export default config;
```

`eslint.config.mjs`를 생성한다.

```js
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript")
];

export default eslintConfig;
```

- [ ] **3단계: 기본 앱 파일 추가**

`.gitignore`를 생성한다.

```gitignore
node_modules
.next
out
.env
.env.local
npm-debug.log*
pnpm-debug.log*
yarn-debug.log*
```

`.env.example`을 생성한다.

```bash
OPENAI_API_KEY=
```

`app/layout.tsx`를 생성한다.

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "찐 후기",
  description: "광고성 리뷰는 걷어내고 구매에 도움 되는 후기만 정리합니다."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

임시 `app/page.tsx`를 생성한다.

```tsx
export default function Home() {
  return <main>찐 후기</main>;
}
```

`app/globals.css`를 생성한다.

```css
@import "tailwindcss";

:root {
  color-scheme: light;
  --background: #f7f5f0;
  --foreground: #191714;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}

button,
input,
textarea {
  font: inherit;
}
```

- [ ] **4단계: 의존성 설치**

실행:

```bash
pnpm install
```

기대 결과: 의존성이 설치되고 `pnpm-lock.yaml`이 생성된다.

- [ ] **5단계: 스캐폴딩 커밋**

실행:

```bash
git add .
git commit -m "feat: scaffold jjin review app"
```

기대 결과: 커밋이 성공한다.

### 작업 2: 분석 계약 추가

**파일:**

- 생성: `lib/analysis/schema.ts`
- 생성: `lib/analysis/prompt.ts`

- [ ] **1단계: 분석 타입과 샘플 결과 추가**

`lib/analysis/schema.ts`를 생성한다. 요청 타입, 응답 타입, 점수 라벨, API 키가 없을 때 사용할 개발용 결과를 포함한다.

핵심 구조:

```ts
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
```

- [ ] **2단계: 프롬프트 빌더 추가**

`lib/analysis/prompt.ts`를 생성한다. 프롬프트는 한국어 JSON만 반환하도록 지시하고, 가짜 리뷰 단정 대신 “광고 의심 신호”로 표현하게 한다.

핵심 함수:

```ts
import type { AnalyzeRequest } from "./schema";

export function buildAnalysisPrompt(request: AnalyzeRequest) {
  const hasPastedReviews = Boolean(request.pastedReviews?.trim());

  return [
    "너는 제품 리뷰 신뢰도 분석가다.",
    "사용자에게 한국어로만 응답한다.",
    "특정 리뷰어, 판매자, 브랜드가 사기라고 단정하지 않는다.",
    "공개 웹 근거 또는 사용자가 붙여넣은 리뷰에서 확인 가능한 내용만 요약한다.",
    "반드시 JSON 객체만 반환한다.",
    `분석 모드: ${hasPastedReviews ? "붙여넣은 리뷰 분석" : "공개 웹 후기 검색 분석"}`,
    `사용자 입력: ${request.query}`,
    hasPastedReviews ? `붙여넣은 리뷰:\n${request.pastedReviews}` : "",
    "JSON 필드는 productName, category, headline, summary, scores, recommendedFor, cautionFor, pros, cons, adSignals, checklist, sources, needsUserReviews, mode를 포함한다."
  ].filter(Boolean).join("\\n\\n");
}
```

- [ ] **3단계: 타입 검사**

실행:

```bash
pnpm typecheck
```

기대 결과: 통과한다.

- [ ] **4단계: 분석 계약 커밋**

실행:

```bash
git add lib/analysis
git commit -m "feat: add review analysis contract"
```

기대 결과: 커밋이 성공한다.

### 작업 3: 분석 API 라우트 추가

**파일:**

- 생성: `app/api/analyze/route.ts`

- [ ] **1단계: API 라우트 구현**

`app/api/analyze/route.ts`를 생성한다.

동작:

- `POST` 요청만 처리한다.
- 요청 본문에서 `query`, `pastedReviews`를 받는다.
- `query`가 비어 있으면 `400`을 반환한다.
- `OPENAI_API_KEY`가 없으면 개발용 샘플 결과를 반환한다.
- 키가 있으면 OpenAI Responses API를 호출한다.
- 모델 응답 JSON 파싱에 실패하면 안전한 실패 결과를 반환한다.

- [ ] **2단계: 타입 검사**

실행:

```bash
pnpm typecheck
```

기대 결과: 통과한다.

- [ ] **3단계: API 라우트 커밋**

실행:

```bash
git add app/api/analyze lib/analysis
git commit -m "feat: add analysis api route"
```

기대 결과: 커밋이 성공한다.

### 작업 4: MVP UI 구현

**파일:**

- 교체: `app/page.tsx`
- 수정: `app/globals.css`

- [ ] **1단계: 홈 화면 교체**

`app/page.tsx`를 실제 MVP UI로 교체한다.

필수 UI 상태:

- 초기 입력 화면
- 분석 중 단계 문구
- 분석 결과 화면
- 출처 접기/펼치기
- 공개 웹 근거 부족 시 리뷰 붙여넣기 화면
- 오류 메시지와 재시도 가능 상태

필수 문구:

- 서비스 이름: `찐 후기`
- 설명: `광고성 리뷰는 걷어내고, 구매에 도움 되는 후기만 정리해드려요.`
- 입력 placeholder: `제품명 또는 상품 URL을 입력해주세요`
- 분석 버튼: `후기 분석하기`
- 보완 입력 문구: `웹에서 충분한 후기를 찾지 못했어요. 가지고 있는 리뷰를 붙여넣으면 같은 기준으로 분석해드릴게요.`

- [ ] **2단계: 전역 스타일 보강**

`app/globals.css`에 다음 기준을 반영한다.

- 모바일/데스크톱 모두에서 텍스트가 겹치지 않는다.
- 입력창과 버튼은 명확한 포커스 상태를 가진다.
- 결과 영역은 카드 남발 없이 읽기 좋은 패널과 리스트 중심으로 구성한다.
- 버튼 텍스트는 줄바꿈되어도 깨지지 않는다.

- [ ] **3단계: 타입 검사와 빌드**

실행:

```bash
pnpm typecheck
```

기대 결과: 통과한다.

실행:

```bash
pnpm build
```

기대 결과: 통과한다.

- [ ] **4단계: UI 커밋**

실행:

```bash
git add app
git commit -m "feat: build jjin review mvp ui"
```

기대 결과: 커밋이 성공한다.

### 작업 5: 로컬 검증

**파일:**

- 검증 중 발견한 결함이 있을 때만 관련 파일을 수정한다.

- [ ] **1단계: 개발 서버 실행**

실행:

```bash
pnpm dev
```

기대 결과: `http://localhost:3000` 또는 사용 가능한 다른 포트에서 앱이 열린다.

- [ ] **2단계: 브라우저 수동 확인**

확인 항목:

- 제품명 입력 후 분석 요청이 동작한다.
- URL 입력 후 분석 요청이 동작한다.
- API 키가 없는 상태에서도 개발용 샘플 결과가 보인다.
- 근거 부족 결과에서 리뷰 붙여넣기 입력창이 나타난다.
- 출처 영역이 접히고 펼쳐진다.
- 모바일과 데스크톱 폭에서 텍스트가 겹치지 않는다.

- [ ] **3단계: 발견된 결함 수정**

검증 중 발견한 결함만 좁게 수정한다.

- [ ] **4단계: 최종 빌드**

실행:

```bash
pnpm build
```

기대 결과: 통과한다.

- [ ] **5단계: 검증 수정 커밋**

수정이 있었다면 실행:

```bash
git add .
git commit -m "fix: polish mvp verification issues"
```

기대 결과: 커밋이 성공한다.
