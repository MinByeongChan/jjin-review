# 찐 후기

제품명 또는 상품 URL을 입력하면 공개 웹 후기를 바탕으로 광고성/협찬성 신호를 분리하고, 구매 판단에 필요한 내용을 정리해주는 Next.js MVP입니다.

## 주요 기능

- 제품명 또는 상품 URL 입력
- OpenAI Responses API 기반 공개 웹 후기 분석
- 찐 후기 신뢰도, 광고 의심도, 구매 만족도 점수 제공
- 반복 언급된 장점/단점, 광고 의심 패턴, 구매 전 체크포인트 정리
- 공개 웹 근거가 부족하면 사용자가 리뷰를 붙여넣어 추가 분석
- 참고 출처 접기/펼치기 UI

## 기술 스택

- Next.js
- React
- TypeScript
- Tailwind CSS
- OpenAI API
- lucide-react

## 실행 방법

의존성을 설치합니다.

```bash
pnpm install
```

환경 변수를 설정합니다.

```bash
cp .env.example .env.local
```

`.env.local`에 OpenAI API 키를 입력합니다.

```bash
OPENAI_API_KEY=your_api_key_here
```

개발 서버를 실행합니다.

```bash
pnpm dev
```

브라우저에서 접속합니다.

```text
http://localhost:3000
```

## 검증 명령어

타입 검사를 실행합니다.

```bash
pnpm typecheck
```

프로덕션 빌드를 실행합니다.

```bash
pnpm build
```

## 프로젝트 구조

```text
app/
  page.tsx              # 입력, 로딩, 결과, 리뷰 붙여넣기 UI
  api/analyze/route.ts  # OpenAI 분석 API 라우트
lib/analysis/
  prompt.ts             # 분석 프롬프트 구성
  schema.ts             # 분석 요청/응답 타입과 fallback 결과
docs/superpowers/
  specs/                # MVP 설계서
  plans/                # 구현 계획서
```

## 참고 사항

- 쇼핑몰 내부 리뷰 크롤링은 MVP 범위에 포함하지 않습니다.
- 공개 웹에서 충분한 근거를 찾지 못하면 리뷰 붙여넣기 분석으로 이어집니다.
- OpenAI API 사용량 또는 결제 한도가 부족하면 앱은 안전한 오류 안내를 보여줍니다.
- `.env.local`은 Git에 커밋하지 않습니다.
