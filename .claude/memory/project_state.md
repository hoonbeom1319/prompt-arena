---
name: project-state
description: 프로젝트 현재 상태 스냅샷 — 마지막 업데이트 2026-06-10
metadata:
  type: project
---

## 2026-06-10 세션 — lint 수정 + finalize 멱등성 + Vercel Cron

### 이번 세션 완료
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
1. **중복 코인 정리 (DB 작업)** — 테스트 챌린지(`11ad52e9-44a4-4b7f-a77b-869b320639ce`)에
   1등+100/2등+50/3등+25 보상이 2배치(10:09, 10:10) 중복 삽입됨. 2번째 배치 삭제 필요.
   아래 SQL을 Supabase SQL Editor에서 실행:
   ```sql
   -- 먼저 확인
   SELECT id, user_id, amount, description, created_at
   FROM coin_ledger
   WHERE challenge_id = '11ad52e9-44a4-4b7f-a77b-869b320639ce'
     AND description LIKE '%등 보상'
   ORDER BY created_at;

   -- 중복 확인 후 두 번째 배치(10:10 시간대) DELETE
   DELETE FROM coin_ledger
   WHERE id IN (
     SELECT id FROM coin_ledger
     WHERE challenge_id = '11ad52e9-44a4-4b7f-a77b-869b320639ce'
       AND description LIKE '%등 보상'
       AND created_at > '2026-06-09T10:09:30Z'  -- 두 번째 배치 시작 시간으로 조정
   );
   ```
2. **CRON_SECRET 환경변수 설정** — `.env.local`에 `CRON_SECRET=<random>` 추가,
   Vercel 대시보드 환경변수에도 동일 값 설정.
3. **is_seed 설계 모순 결정** — 투표 페이지가 `is_seed=true` 제외하는데 admin seed는 `is_seed=true`로 생성.
   운영자 콜드스타트 시드를 투표에 포함할지 결정 필요.
4. **Google OAuth redirect_uri_mismatch** — Google Cloud Console에서 redirect_uri 등록 (코드 문제 아님).

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
