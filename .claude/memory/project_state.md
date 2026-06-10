---
name: project-state
description: 프로젝트 현재 상태 스냅샷 — 마지막 업데이트 2026-06-10
metadata:
  type: project
---

## 2026-06-10 세션 (2) — hb-kit 디자인 시스템 업데이트

### 이번 세션 완료 (2)
- **디자인 시스템 전면 업데이트** — hb-kit 디자인 핸드오프(`docs/design_handoff_prompt_arena/`) 기반.
  - 색상: 탠저린→sky-600 accent, slate 뉴트럴, 전 토큰 OKLCH
  - 폰트: Pretendard 자체 호스팅 (woff2 × 5, `public/fonts/`)
  - 반경: 8/12/16px → 6/8/12px (평탄한 flat shadow)
  - DS 컴포넌트: Button/Card/Badge 핸드오프 스펙 반영
  - ChallengeHero: gradient 제거 + phase strip (제출→투표→결과 진행 표시)
  - ResultsPage: 우승 카드 sky accent 적용
  - ESLint: `docs/**` globalIgnores 추가 (디자인 파일 jsx 오류 방지)

### 이전 세션 완료
- **lint 전량 수정** — `types/**` globalIgnores 추가(Next.js 자동생성), `require()` → ESM import(`mock-supabase.ts`),
  미사용 import 제거(`CardContent`), dead code 제거(`makeCountBuilder`), `_isCountBuilder` 리네임.
  `argsIgnorePattern/varsIgnorePattern: '^_'` ESLint 규칙 추가.
- **finalize 멱등성 가드** — `lib/finalize.ts`로 코어 추출.
  `final_rank IS NOT NULL` 체크로 이미 확정된 챌린지 재실행 차단 (`skipped: true` 반환).
- **admin "결과 확정" 버튼 개선** — 확정 후 버튼 숨김 + "확정됨" 뱃지 표시.
  form POST → 확정 후 `/admin/challenges`로 redirect (JSON 화면 노출 버그 수정).
- **Vercel Cron 자동 확정** — `app/api/cron/finalize/route.ts` + `vercel.json` (매일 UTC 03:00).
  `CRON_SECRET` 인증 헤더. `finalizeChallenge()`를 cron·수동 모두 공유.

### 다음 세션 TODO
- 현재 미결 항목 없음. 새 기능 요구사항 생기면 추가.

### 완료된 인프라 작업 (2026-06-10)
- 중복 코인 정리 완료 — `coin_transactions` 테이블에서 두 번째 배치 삭제 (테이블명 `coin_transactions`, 컬럼명 `reason`)
- `CRON_SECRET` 환경변수 설정 완료 — `.env.local` + Vercel 대시보드

### 기타 관찰
- Vercel Cron은 Hobby 플랜에서 하루 1회 실행 가능. Pro 이상이면 더 자주 설정 가능.
- `finalizeChallenge()`는 제출이 0개면 `{ skipped: false, finalizedCount: 0 }` 반환 (에러 아님).

### 테스트 데이터 현황 (DB)
- admin: `beom hoon`(승격됨). 더미 참가자 3명(프롬프트장인/초보코더/AI덕후, auth+프로필+제출).
- 테스트 챌린지 1개(`11ad52e9-44a4-4b7f-a77b-869b320639ce`), 결과 상태·finalize됨(코인 중복 있음).

## 이전 세션 완료 (배경)
- 2026-06-09: Gemini 작동, service client RLS 버그, 챌린지 일정 단순화, wrapper_text 수정,
  투표/결과 RLS 우회(`GET /api/vote`), 동점 처리 규칙(`lib/ranking.ts`).
- 이전: DS(`ds/`) 구축, 전체 Tailwind+DS 마이그레이션, React 19, 컨벤션 문서화.

**Why:** 여러 컴퓨터에서 작업하므로 세션 간 상태 추적.
**How to apply:** 새 세션 시작 시 위 TODO부터. 코드가 이 파일보다 최신일 수 있으니 실제 코드 우선.
