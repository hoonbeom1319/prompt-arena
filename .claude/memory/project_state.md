---
name: project-state
description: 프로젝트 현재 상태 스냅샷 — 마지막 업데이트 2026-06-09
metadata:
  type: project
---

## 2026-06-09 세션 — 제출→투표→결과 전체 흐름 실유저 테스트 + 다수 수정

### 이번 세션 완료
- **Gemini 작동 확정** — Developer API는 한국 계정 선불(prepaid). 선불 충전으로 해결.
  모델 `gemini-2.5-flash`로 통일 (1.5/2.0은 죽음). 상세: [[blocker-gemini-billing]]
- **service client RLS 버그 수정** (`lib/supabase/server.ts`) — 쿠키 떼고 secret key만 사용.
  이전엔 로그인 유저 JWT가 Authorization을 덮어써 RLS 우회 실패 → 챌린지 생성·코인 insert 전부 막혀 있었음.
- **챌린지 일정 = 제출일 1개만 입력** — 마감/투표 시작·마감 입력 제거. 제출일에서 주간 사이클 자동 파생
  (제출 → +1일 투표 → +2일 결과). `app/admin/challenges/new` + `app/api/admin/challenges/route.ts`.
- **wrapper_text footgun 수정** (`lib/gemini.ts`) — `{{prompt}}` 없으면 프롬프트를 버리지 않고 이어붙임.
  wrapper는 PRD §4.0-B 공정성 장치라 유지(제거 안 함), nullable.
- **생성 시도 5→3회** — 코드 5곳 + PRD 16곳 동기화.
- **제출 후 "다시 시도하기" 버튼 제거** (`ChallengeHero`) — PRD "제출 확정 잠금"과 일치.
- **투표/결과 RLS 우회** — `generations`(owner-only)·`users`(own-only)가 남의 결과물/닉네임 읽기를 막아
  투표·결과가 본인 것만 보였음. 신규 `GET /api/vote`(service client, 프롬프트는 3표 후 공개)로 우회,
  결과 페이지는 service client로 전환. `results` 페이지의 onClick 버그는 `CopyLinkButton`(클라 컴포넌트)로 분리.
- **동점 처리 규칙** (`lib/ranking.ts`) — 득표→시도수(적을수록↑)→제출시각(빠를수록↑)→완전동률시 공동순위.
  finalize + 결과페이지 미리보기 공유.

### 다음 세션 TODO (오늘 중단 지점)
1. **finalize 멱등성 가드** — 이미 확정된 챌린지 재실행 차단 (submission.final_rank 존재 시 skip).
   + admin "결과 확정" 버튼도 확정 후 숨김/비활성. (유저가 두 번 눌러 코인 중복 발생함)
2. **Vercel Cron 자동 확정** — 투표 마감 지난 미확정 챌린지 자동 finalize.
   계획: finalize 코어를 `lib/finalize.ts`로 추출(가드 내장) → 수동 라우트 + `api/cron/finalize`가 공유.
   `vercel.json` cron 설정 + `CRON_SECRET` 인증.
3. **중복 코인 정리** — 테스트 챌린지(11ad52e9)에 1등+100/2등+50/3등+25 보상이 2배치(10:09, 10:10) 중복 삽입됨.
   2번째 배치 삭제 필요. (잔액은 한 배치만 반영돼 있어 ledger만 정리하면 됨)

### 기타 관찰 / 미결정
- finalize "결과 확정"이 일반 form POST라 누르면 `{success:true}` JSON 화면이 뜸 → redirect로 다듬기 필요.
- **is_seed 설계 모순**: 투표 페이지가 `is_seed=true`를 제외하는데, admin seed 기능은 `is_seed=true`로 생성 →
  운영자 콜드스타트 시드가 투표에 안 뜸. PRD §3 의도와 충돌. 포함/제외 정책 결정 필요.
- (이전부터) Google OAuth redirect_uri_mismatch — Google Cloud Console 설정 필요 (코드 문제 아님).

### 테스트 데이터 현황 (DB)
- admin: `beom hoon`(승격됨). 더미 참가자 3명(프롬프트장인/초보코더/AI덕후, auth+프로필+제출).
- 테스트 챌린지 1개(`11ad52e9-44a4-4b7f-a77b-869b320639ce`), 현재 결과 상태로 finalize됨(코인 중복 있음).

## 이전 세션 완료 (배경)
- DS(`ds/`) 구축: Button/Input/Textarea/Card/Badge/Label (Radix + CVA + Tailwind, `cn()`).
- 전체 페이지 Tailwind+DS 마이그레이션, React 19(`forwardRef` 제거), 컨벤션 `CLAUDE.md` 문서화.

**Why:** 여러 컴퓨터에서 작업하므로 세션 간 상태 추적.
**How to apply:** 새 세션 시작 시 위 TODO부터. 코드가 이 파일보다 최신일 수 있으니 실제 코드 우선.
