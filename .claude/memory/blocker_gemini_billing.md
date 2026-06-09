---
name: blocker-gemini-billing
description: Gemini API 결제 블로커 — 2026-06-09 해결됨 (선불 충전 + 모델 gemini-2.5-flash)
metadata:
  type: project
---

## Gemini API 결제/모델 — 해결됨 (2026-06-09)

### 결론 (현재 정상)
- **결제**: Developer API(`generativelanguage.googleapis.com`)는 한국 계정에서 **선불(prepaid) 전용**.
  AI Studio billing에서 **선불 크레딧 충전** 후 `generateContent` 200 정상. (코드 변경 없이 해결)
- **작동 모델**: `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-3.5-flash`, `gemini-flash-latest` 전부 200.
  앱 기본값은 **`gemini-2.5-flash`** 로 통일.
- **죽은 모델(404)**: `gemini-1.5-flash/pro` (retire), `gemini-2.0-flash`/`gemini-2.0-flash-001` (no longer available).
  → 이 이름들 다시 쓰지 말 것.

### 코드에 박힌 모델명 (전부 gemini-2.5-flash로 교체 완료)
- `lib/gemini.ts` — `generateWithPrompt` 기본값, `generateChallengeDraft`
- `app/api/admin/challenges/route.ts` — `model_name` 기본값
- `app/admin/challenges/new/page.tsx` — form 기본값 + 드롭다운 옵션(2.5-flash/2.5-pro/3.5-flash)

### 핵심 교훈 (다음에 헤매지 않게)
- 키를 GCP 콘솔에서 만들어도 `@google/generative-ai`/`@google/genai`(옵션 없음)는 **Developer API**로 가고
  결제는 **AI Studio(선불)** 로 관리됨. 키 발급 위치는 결제 모델을 안 바꿈.
- GCP **후불**을 쓰려면 **Vertex AI**(`aiplatform.googleapis.com`, ADC/서비스계정 인증, 코드 수정)로 가야 함.
  이번엔 선불 충전(A안)으로 해결해서 Vertex 전환은 안 함.
- 진단 순서: `ListModels`가 200이면 키·API·제한은 정상 → 남은 건 결제/모델뿐.

**Why:** 같은 진단을 매 세션 처음부터 반복하지 않기 위해. 결제·모델명 삽질이 길었음.

**How to apply:** generate가 다시 막히면 ① `ListModels` 200인지(인증) ② generateContent가 429(결제)인지
404(모델명)인지로 갈라서 본다. 모델은 `gemini-2.5-flash` 기준. 관련: [[project-state]]
