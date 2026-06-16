# 찐 후기 MVP Design

## Goal

`찐 후기` is a web app that helps users judge whether public product reviews feel authentic or promotional. Users enter a product name or product URL. The app searches public web sources, filters for useful review signals, and returns a concise buying-oriented summary with authenticity and advertising suspicion scores.

The MVP keeps the main promise simple: enter a product and get a trusted review digest. If public web evidence is insufficient, the app asks the user to paste reviews and analyzes those with the same criteria.

## Scope

In scope:

- Product name or URL input.
- Public web review search through the OpenAI API.
- Automatic product/category inference.
- Hybrid fallback to pasted review text when web evidence is weak.
- Result view with one-line conclusion, scores, evidence summary, warning patterns, buying checklist, and collapsible sources.
- Server-side OpenAI API calls only.

Out of scope for MVP:

- Crawling private or login-gated shopping mall review tabs.
- Browser extension integration.
- User accounts, saved history, payments, and sharing.
- Claims that the app can prove whether a review is fake.

## User Flow

1. The first screen shows one central input:
   `제품명 또는 상품 URL을 입력해주세요`
2. The user submits a product name, brand plus product name, or URL.
3. The server interprets the input, searches public web sources, and asks the model to classify review usefulness and promotional risk.
4. If evidence is sufficient, the app shows the analysis result.
5. If evidence is weak, the app shows:
   `웹에서 충분한 후기를 찾지 못했어요. 가지고 있는 리뷰를 붙여넣으면 같은 기준으로 분석해드릴게요.`
6. The user can paste review text and receive the same result format.

## Result Structure

The analysis result contains:

- `headline`: one-line buying conclusion.
- `scores`: authenticity confidence, advertising suspicion, and purchase satisfaction.
- `summary`: short explanation of the overall pattern.
- `recommendedFor`: who may like the product.
- `cautionFor`: who should be careful.
- `pros`: concrete positive points from reviews.
- `cons`: concrete negative points from reviews.
- `adSignals`: promotional or low-trust patterns.
- `checklist`: things to verify before purchase.
- `sources`: collapsible source list with title, URL, source type, and reliability note.
- `needsUserReviews`: whether fallback pasted reviews should be requested.

## Analysis Logic

The app treats the LLM as an evidence organizer, not an oracle.

Server-side analysis steps:

1. Parse whether the input is a URL or product query.
2. Infer product name and likely category.
3. Search public web sources for review-oriented evidence.
4. Prefer concrete experience signals such as long-term use, detailed defects, comparisons, photos/videos mentioned in text, and specific context.
5. Flag low-trust signals such as sponsorship disclosure, affiliate-heavy language, repetitive praise, spec-only writing, or no concrete usage context.
6. Generate structured JSON for the UI.
7. Mark `needsUserReviews` when source count, source diversity, or review specificity is too low.

## Architecture

The MVP is a Next.js app.

- `app/page.tsx`: single-page chat-like interface and result states.
- `app/api/analyze/route.ts`: server route that calls the OpenAI API.
- `lib/analysis/schema.ts`: shared TypeScript types and default result helpers.
- `lib/analysis/prompt.ts`: prompt construction and output instructions.

The OpenAI API key is stored in `OPENAI_API_KEY` and used only on the server.

## Error Handling

- Missing input: show an inline validation message.
- Missing API key: return a friendly setup error in development.
- OpenAI/API failure: show a retryable error state.
- Invalid model JSON: return a safe fallback result explaining that the analysis could not be completed.
- Weak web evidence: do not fail; ask for pasted reviews.

## Testing

Initial verification:

- TypeScript/build check.
- Manual browser test for:
  - product-name input
  - URL input
  - weak evidence fallback
  - pasted review analysis
  - error state when API key is missing

Automated tests can be added after the MVP once the prompt contract stabilizes.

## Product Principles

- Keep the first screen simple.
- Show confidence and sources instead of pretending certainty.
- Avoid accusing specific reviewers or sellers of fraud.
- Make the fallback path feel helpful, not like a failure.
