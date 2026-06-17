---
name: project-state
description: 프로젝트 현재 상태 스냅샷 — 마지막 업데이트 2026-06-17 (아키텍처 리팩토링 P0~P6 전부 완료)
metadata:
  type: project
---

## 현재 상태 (2026-06-17 13차 갱신) — 아키텍처 리팩토링 P6 완료 (P0~P6 종료)

P6(폴더 수렴) 6개 항목 각각 독립 커밋·단계별 그린(tsc·ESLint·build·vitest 79/79). **이로써 ARCHITECTURE 로드맵 P0~P6 전부 종료.** [[project-philosophy]]

- **P6-1 lib/ai/** (`f7dbfc8`): gemini·summary → lib/ai/. importer 4 + 테스트 목 2.
- **P6-2 lib/challenge/** (`5cf38bc`): challenge-state·challenge-schedule·finalize·home-data·ranking → lib/challenge/. **importer 20파일** + 테스트 경로 갱신. challenge-schedule 깨진 상대 import(./time)→@/lib/time.
- **P6-3 lib/coin/ 분해** (`db8f1ab`): coins.ts → amounts(상수·reason)·recovery(회복 비용)·ledger(awardCoins·뱃지) + **index 배럴**. 소비자 `@/lib/coins`→`@/lib/coin`(4 + 테스트 5). reason 값 불변.
- **P6-4 lib/quiz/ 분해** (`ef2eadb`): quiz.ts(331줄) → data(조회·타입)·streak(계산)·scoring(채점)·recovery(회복) + **index 배럴**. **배럴 덕에 `@/lib/quiz` 경로 그대로 → 외부 import 무변경**(폴더+index가 같은 경로로 resolve). 회복 비용은 @/lib/coin 참조.
- **P6-5 컴포넌트 colocation** (`f38666d`): 단일 사용처 흡수 — AiSummary·BlindCard→vote/, Podium→results/, GenPips→generate/, TopicCard·CountdownCard·CountdownTimer→widgets/home/. **잔류(2+ 라우트 공유)**: AppBar·TabBar·RankBadge·VoteTokens·StatsRow·GeminiOutputLabel·admin/AdminShell.
- **P6-6 hooks/ 검증 → 미생성 결정**: 커스텀 훅 3개(useQuizGame·useGeneration·useVoting) 전부 단일 라우트 colocate라 **공유 훅 0개** → 빈 `hooks/` 안 만듦. ARCHITECTURE §1·§9에 근거 명문화. (코드 변경 없음, 문서만.)
- **기법 메모**: 대량 import 경로 갱신은 .NET `File.ReadAllText`+`.Replace()`+UTF8(no BOM) `WriteAllText`로 일괄(한글·LF 보존). git mv로 이력 보존. tsc가 누락 import를 전수 검출하므로 안전.
- **현재 lib 구조**: `lib/{utils,shuffle,constants,time,rank-colors}.ts` + `supabase/` + `ai/`·`challenge/`·`coin/`·`quiz/`(각 도메인). `lib`에 `function` 키워드 0개·도메인 분해 완료.

### A-9 코인 경제 모니터링 — **홀드 (사용자 지시 2026-06-17)**

P5 reason 상수화로 선행 작업은 끝났으나(reason별 집계 가능), **집계 화면 착수는 보류**. 재개 시: 적립vs사용·회복 사용률·"퀴즈 누적 < 챌린지 우승" 부등호 감시. [[project-state]]

## 현재 상태 (2026-06-16 12차 갱신) — 아키텍처 리팩토링 P5 완료

P5(§5~§7) 6개 항목을 각각 독립 커밋·단계별 그린(tsc·ESLint·build·vitest 79/79)으로 마무리. [[project-philosophy]]

- **P5-1 lib `export function`→화살표 스윕** (`e4d380f`): coins·finalize·home-data·challenge-state·gemini·supabase/{server,client} + home-data 내부 헬퍼. 전방 참조는 호출 시점 해소라 순서 조정 불필요. **이제 lib에 `function` 키워드 0개**(컴포넌트 아닌 것 전부 화살표 = §7 확정).
- **P5-2 코인 reason 상수화** (`3e989a5`): `lib/coins.ts`에 `COIN_REASONS`(객체)+`CoinReason`(타입)+`RANK_REASONS`(등수→reason 맵) 신설, `awardCoins(reason: CoinReason)`로 시그니처 축소. 호출부 4곳(quiz·finalize·vote·submit) 한글 리터럴 제거. finalize의 `` `${rank}등 보상` `` 동적 리터럴은 RANK_REASONS 맵으로. **값 문자열 불변(과거 DB 기록과 일치)** → 테스트 목 3곳에 reason export 추가(목은 값 그대로라 어서션 무변경). **A-9 코인경제 모니터링의 선행 작업 완료** — 이제 reason별 집계 가능.
- **P5-3 `lib/time.ts` 신설** (`a21616d`): KST 경계 단일화(`KST_OFFSET`·`kstToday`·`nextCalendarDay`·`kstISO`). quiz.ts(kstToday 로컬)·challenge-schedule.ts(KST_OFFSET·pad·nextCalendarDay·inline kstISO)·admin/quiz/route.ts(pad·nextCalendarDay 중복 + kstToday import 경로) 흡수.
- **P5-4 import/스타일 교정** (`ec8dbb8`): ds/accordion·widgets/home/HomeBody·app/layout의 큰따옴표+세미콜론 → 작은따옴표+세미콜론없음. TS 문자열 리터럴도 작은따옴표, **JSX 속성 큰따옴표는 관례대로 유지**(Podium 등 준수 파일과 동일). 컴포넌트는 `function` 유지(올바름).
- **P5-5 토큰 정리 + 2벌 구조 정정** (`fbac1d1`): Podium 인라인 `var(--color-*)` fallback → Tailwind 유틸(bg-bg-subtle·text-text-muted), 동적 메달 oklch만 인라인 잔류. **⚠️ 핵심 발견: globals.css "2번째 색 토큰 세트 삭제"는 불가로 확정.** `@theme inline`은 값을 유틸에 인라인하고 `--color-*` var를 **:root에 emit 안 함**(컴파일 CSS 확인). 생짜 CSS(body·scrollbar)+`color-mix` 임의값(badge·alert 다수, 앱 전반 라이브)이 이 `:root` 세트를 **런타임 var로 참조** → 지우면 런타임 깨짐(tsc/build/test 미감지). 애초 "Podium만 쓴다"는 §8 가정이 틀렸음. globals.css 주석 + ARCHITECTURE §5·§8에 근거 명문화. **두 세트는 값 동기화로 영구 유지.**
- **P5-6 장식 글리프 정리** (`76e228f`): "✦ GEMINI 결과물" 5곳 동일 마크업 → `components/GeminiOutputLabel` 단일 출처. 실행 버튼 ⚡ 2곳(generate·seed) → `IconZap`(§3.2 컨트롤 아이콘=ds/icons). SeedClient "✦ 최근 추가된 결과물"은 단일·고유라 잔류.
- **남은 단계**: P6 폴더 수렴(`hooks/`·`lib/<domain>/`·components colocation·`coins.ts`·`quiz.ts` 분해). 미push(사용자 직접).

## 현재 상태 (2026-06-16 11차 갱신) — 아키텍처 리팩토링 (P0~P4 완료)

"작동만 되게" 부채 정리. 사용자 진단(클라 직접 supabase·useState 폭발·아이콘 무체계·죽은 코드)에서 시작. **컨벤션을 먼저 문서로 못박고 단계별 수렴** 방식. 구조 모델은 *역할별 유지+두껍게*(FSD 아님), 데이터는 *커스텀 훅+API 라우트*, 함수 스타일은 *비컴포넌트 전부 화살표*로 확정. [[project-philosophy]]

- **`docs/ARCHITECTURE.md` 신설** — 타깃 아키텍처·컨벤션·리팩토링 로드맵(P0~P6)의 단일 출처. `CLAUDE.md`에 `@docs/ARCHITECTURE.md` 연결돼 매 세션 로드됨. **새 코드는 이 문서를 따른다.**
- **P0 컨벤션 확정** + **P1 죽은 코드 7개 삭제**: VoteCard·CoinDisplay·SubmissionCard·Header·AuthGuard·ChallengeHero + BadgeList(보류 뱃지 UI였으나 레거시 인라인 스타일이라 삭제, git에 남음). ⚠️ 감사가 TopicCard·CountdownCard·CountdownTimer를 죽었다 오판 → HomeBody가 사용 중이라 **유지**(검증으로 교정). **삭제 전 grep 검증 필수 교훈.**
- **P2 데이터 접근 (완료)**: 클라이언트 supabase 직접 호출 제거. `generate`·`vote`·admin 폼 3개(seed·new·edit)를 **서버 컴포넌트(읽기) + 클라이언트 island(인터랙션/api)**로 분리. **저장소 클라 supabase는 이제 인증(login·LogoutButton)만**(ARCHITECTURE §2.3 예외). 쓰기는 전부 `/api`, 읽기는 서버컴포넌트(초기) vs `/api`(인터랙션 갱신) 케이스별.
- **P3 훅 추출 (완료)**: 3개 클라이언트 island의 useState 뭉치를 단일 라우트 전용 `use<Domain>` 훅으로 추출(colocate). `QuizClient`(10개)→`app/quiz/useQuizGame.ts`, `GenerateClient`(9개)→`app/challenge/[id]/generate/useGeneration.ts`, `VoteClient`(8개)→`app/challenge/[id]/vote/useVoting.ts`. **패턴 결정: 데이터·async 상태 머신은 훅, 순수 UI 상태는 컴포넌트 잔류.** 라우팅(quiz 로그인 리다이렉트)·모달 열림(generate 확인)·마스터디테일 선택/아코디언(vote)은 UI 관심사라 컴포넌트에 둠. `submit()`은 성공 여부 반환→컴포넌트가 모달 닫기 결정. vote의 `myVotes: VoteState[]` 래퍼는 `string[]`로 평탄화(`hasVoted()` 노출). 훅 안 fetch도 §2 준수(`/api` 경유). 2곳+ 공유 훅 아니라 `hooks/` 폴더는 아직 미생성(P6).
- **P4 ds 프리미티브 (완료)**: ① `ds/modal.tsx` 신설 — 오버레이·포커스·Esc·배경클릭·바디스크롤잠금 단일화, `placement`(center/sheet)로 분기. ad-hoc 모달 2곳(generate 확인·quiz RecoverModal)을 흡수(감사가 말한 "vote 모달"은 현재 코드엔 없음=구버전 기준). RecoverModal은 소급불가라 `closeOnBackdrop=false`. ② `ds/icons.tsx` 신설 — 13파일 인라인 SVG 22개 + 파일내부 `const XxxIcon` 7개를 단일 출처로. **설계: 스트로크계 아이콘은 root `<svg>`에 stroke 속성, 자식은 geometry만(SVG presentation 상속) → 호출부가 width/height/strokeWidth/className(색)을 props로 조정, 픽셀 동일.** 아이콘: Lock·ChevronLeft·Check·ChevronRight·ChevronDown·Trophy·Logout·Gear·Pencil·Users·Moon·Zap·Google(브랜드 멀티컬러)·nav4종(Home/Clock/Quiz/Person, `filled` prop). Trophy 공통 path로 정규화(Podium lid 미세차 흡수), 흰색 체크는 currentColor+text-white. **저장소 전체 `<svg>`는 이제 ds/icons.tsx에만 존재.**
- **남은 단계 (미착수)**: P5 토큰 단일화(globals.css 2번째 색세트 삭제 — Podium 인라인 style 토큰화 후)+import/파일명 교정(`ds/accordion.tsx`·`widgets/home/HomeBody.tsx` 큰따옴표·세미콜론 이탈자)+lib `export function`→화살표 스윕+코인 reason 상수+`lib/time`, P6 폴더 수렴(`hooks/`·`lib/<domain>/`·components colocation·coins.ts/quiz.ts 분해). **A-9 코인 경제 모니터링은 P5(reason 상수화) 이후.** ※ 잔여 글리프: `✦`(GEMINI 결과물, 4곳)·`⚡`(실행 버튼) 등 장식 이모지는 §3.2 상수화 대상이나 인라인 SVG 아니라 P4 범위 밖 — P5에서 처리 검토.
- 커밋 `a1f363e`(P0+P1)·`2d74e43`(P2 generate)·`9393d81`(P2 vote)·`dbd1fb3`(P2 admin)·`a125249`(P3 quiz)·`7778947`(P3 generate)·`a96de8b`(P3 vote)·`eb75dd3`(P4 modal)·`2723128`(P4 icons). 각 단계 tsc·ESLint·빌드·vitest 79/79 그린. 미push.
- ※ 아래 "리팩터링 진행 중 (2026-06-11)" Step 1/2/3 메모는 이 아키텍처 작업으로 **대체됨**(widgets/ 레이어는 유지).

## 현재 상태 (2026-06-16 8차 갱신) — PRD v1.4 연승 회복 (코인 첫 사용처) 구현

PRD `docs/PRD/prompt-arena-prd-v1.4.md` 4.7.6 신규 기능 구현. v1.4의 핵심은 단 하나 — **코인이 적립만 → 적립+사용으로 전환, 첫 사용처=퀴즈 연승 회복.** 사용자 결정으로 **"연승 회복 코어만"** 범위(A-9 admin 코인경제 모니터링은 다음으로). [[project-philosophy]]

### DB 마이그레이션 — 적용 완료 (2026-06-16, 사용자가 실행)

`supabase/migrate-v1.4-streak-recovery.sql` 실행됨 → `streaks`에 컬럼 2개 추가:
- `recoverable_streak integer` (틀려서 끊긴 직전 연승값, >0이면 회복 대상)
- `recoverable_date date` (틀린 게시일 — 오늘 문항 게시일과 같을 때만 회복 허용 = **소급 불가**의 구현)
`schema.sql`도 동기화함(streaks 정의). **coin_transactions는 변경 없음** — 사용(차감)은 기존 원장에 음수 `amount`로 기록(첫 음수 거래, reason `'연승 회복'`).

### 설계 핵심 (PRD 4.7.6)

- **틀려서 끊긴 경우만 회복.** 미참여 끊김은 `submitQuizAnswer`를 안 타고 `nextStreakValue`가 1로 떨굼 → **구조적으로 회복 불가**(별도 차단 코드 불필요). "안 와도 코인 쓰면 됨" 구멍 원천 차단.
- **비용 = 끊긴 직전 연승 × N.** `STREAK_RECOVERY_COST_FACTOR=1`(`lib/coins.ts`), `recoveryCost(n)`. N=1이면 길수록 거의 공짜 → 사용률 과하면 상향(다음 사이클 모니터링 대상).
- **유지만(+1 없음).** 회복 시 `current_streak=끊긴값`으로 복원하되 **`last_correct_date=오늘`으로 갱신** → 다음 정답일에 연속이 이어짐(거기서 +1). (값은 +1 안 함 = 틀린 날을 정답으로 안 침.)
- **소급 불가.** `recoverable_date==오늘 게시일`일 때만 회복 허용 → 내일 새 문항 게시되면 어제 끊김은 회복 대상에서 자동 탈락. 코인 부족 시 회복 불가.
- **잔액 음수 방지:** `awardCoins`는 음수 방지 안 함 → 회복 API(`recoverStreak`)가 `balance < cost` 사전 체크.

### 구현 파일

- **`lib/quiz.ts`**: `submitQuizAnswer` 오답 분기에서 끊긴 직전 연승 보존(`recoverable_streak/date` upsert) + `SubmitResult`에 `recoverable/recoverableStreak/recoverCost/balance` 추가. 신규 `recoverStreak()`(검증→차감→복원), `getRecoverState()`(새로고침 후 팝업 일관 재노출), `getCoinBalance()`.
- **`app/api/quiz/recover/route.ts`** 신규 POST — 인증 후 `recoverStreak` 위임. 회복 불가 시 409.
- **`app/api/quiz/route.ts`**·**`app/quiz/page.tsx`**: GET/SSR이 `recover` 상태 함께 반환.
- **`app/quiz/RecoverModal.tsx`** 신규 — 회복 제안 팝업(ds에 모달 없어 신규). 코인 부족 시 버튼 비활성. **`app/quiz/QuizClient.tsx`**: 틀린 직후 모달, 포기=0확정(소급불가), 같은 날 재오픈 링크, 회복 성공 시 "🛡️ N연승 지킴" 문구.
- **검증**: tsc·ESLint 클린, vitest **78/78**(`coins.test.ts`에 회복 비용 테스트 +3, "MVP는 적립만" 테스트는 v1.4가 뒤집어 문구 수정).

### 남은 일

- **push 대기**: 커밋 `43e37a6` 완료, 프로덕션 빌드 통과(새 라우트 `/api/quiz/recover` 등록 확인). 마이그레이션 적용됐으니 push 안전. **push는 사용자가 직접**(Vercel 자동 배포).
- **로컬 미검증**: 실동작(오답→팝업→코인차감→복원)은 문항 등록된 날 확인 필요.
- **A-9 admin 코인경제 모니터링**: 이번 범위 제외. 적립vs사용·회복사용률·"퀴즈 누적<챌린지 우승" 부등호 감시 — 다음 사이클.

---

## 현재 상태 (2026-06-16 7차 갱신) — PRD v1.3 데일리 O/X 퀴즈 + 연승 구현

PRD `docs/prompt-arena-prd-v1.3.md` 4.7 신규 기능을 풀스택으로 구현. v1.3의 다른 변경은 코드 작업 불필요(admin AI 내부호출 제거는 `af6e6ab`에서 이미 완료, 신고·사전필터는 홀딩).

### DB 마이그레이션 — 적용 완료 (2026-06-16, 사용자가 실행)

`supabase/migrate-v1.3-quiz.sql` 실행됨 → `quiz_items`(질문/정답O·X/해설/publish_date unique), `quiz_answers`(user+item unique, 하루 1회), `streaks`(current/best/last_correct_date) 테이블 + RLS 생성됨. **`schema.sql` 전체 재실행은 금지였음** — 기존 `create policy`가 `if not exists` 미지원이라 "already exists" → SQL editor 트랜잭션 전체 롤백. 그래서 증분 파일만 실행. ⚠️ *뱃지 포함 초기 버전* migrate를 돌렸다면 `streak_10/20/30` 뱃지 3행이 dormant로 남을 수 있음(수여 로직 제거됨 → 무해. 지우려면 migrate 파일 하단 주석 `delete` 실행).

### 남은 일 (운영)

- **문항 비축 등록 예정**: 사용자가 곧 퀴즈 ~30개 배치 등록 예정(`/admin/quiz`). 등록 전엔 `/quiz`가 "오늘은 퀴즈가 없어요"(정상).
- **push 시 배포**: 코드는 commit 완료, push는 사용자가(DB 이미 적용돼 push 순서 제약 해제).
- **로컬 화면 미검증**: 실동작(O/X 응답·연승 누적)은 문항 등록 후 확인 필요.

### 구현 내용

- **연승 규칙(핵심)**: 정답 시 `nextStreakValue(prevCurrent, lastCorrectDate, prevPublishDate)` 순수함수로 판정 — 직전 *출제된* 날(공백 건너뜀)에 내가 정답이었으면 +1, 아니면 1. 틀리면 0(`last_correct_date` 미갱신). "하루 빠지면/틀리면 초기화" + "출제된 날만 카운트"(비축 소진이 연승 안 깸). `lib/quiz.ts`. 하루 기준=KST 자정(`kstToday`).
- **보상**: 매일 정답 `COIN_AMOUNTS.QUIZ_CORRECT_DAILY=1`만. **마일스톤 뱃지·코인 보너스는 제외**(사용자 결정 — 연승 숫자 자체가 보상). 나중에 마일스톤 코인 켤 경우 두 부등호 사수 주석을 `lib/coins.ts`에 남김.
- **보안**: `quiz_items`는 정답·해설 포함이라 RLS public read 안 줌 → 오늘 문항 노출/채점 모두 service-role 서버에서만. 응답 전 정답 노출 금지. 정답·해설은 *응답 후에만* 클라에 내려감.
- **사용자**: `app/quiz/page.tsx`(서버, 초기상태 주입) + `app/quiz/QuizClient.tsx`(O/X→즉시 채점·해설·연승). 비회원은 체험만(연승·코인 미집계, 답 누르면 `/auth/login`). `app/api/quiz/route.ts` GET/POST(서버가 오늘 문항 직접 결정, 하루 1회 가드). TabBar에 '퀴즈' 탭 추가(아레나/지난챌린지/**퀴즈**/내프로필 4탭).
- **admin**: `app/admin/quiz/page.tsx` — 외부 AI로 만든 O/X 문항을 **JSON 배열만** 붙여넣어 *배치 등록*. **시작 게시일 UI 제거**("맞춰야 할 압박" 피드백) → 서버가 `start_date` 없으면 오늘(KST)부터 빈 날짜 순차 배정(점유 날짜 skip). 비축 잔량(오늘 이후 N일치, ≤3 경고) + 예정 목록. `app/api/admin/quiz/route.ts` GET/POST(admin 가드, 검수: 정답 O/X·질문·해설 필수, `start_date` 선택값). AdminShell 사이드바에 '데일리 퀴즈' 메뉴.
- **검증**: tsc·ESLint 클린, vitest **76/76**(`__tests__/quiz.test.ts` — 연승 엣지·부등호), 프로덕션 빌드 통과.

## 현재 상태 (2026-06-16 6차 갱신)

### TO-DO 처리 (2026-06-16) — `docs/TO-DO/TO-DO.md` 4건 + 신고기능 보류 → 커밋·배포 완료

- **#1 투표 API 성능(2.77s)**: `app/api/vote/route.ts` — GET·POST의 독립 쿼리를 `Promise.all` 병렬화(왕복 2회→1회). GET=`myVotes`+`submissions` 동시, POST=`voteCount`+중복검사 동시. (주의: 한때 중복검사를 `.maybeSingle()`로 바꿨다가 vote 단위테스트 목이 `single`만 정의해 7건 깨짐 → `.single()`로 원복. 목 호환 위해 유지). 느림의 근본은 `auth.getUser()` 네트워크 검증 + 콜드스타트라 코드 병렬화는 부분 개선
- **#2 admin/submissions 모니터링 개선**: 챌린지별 그룹을 네이티브 `<details>` 아코디언으로(첫 그룹만 `open`), **시드 출품작 제외**(`filter(!is_seed)`), 시드 뱃지·카운트 제거. (→ 후속: 애니메이션 없는 네이티브 `<details`를 공용 컴포넌트로 교체. 아래 "UI 폴리시" 참고)
- **#3 투표 모바일 단일 아코디언**: `BlindCard` 결과물 펼침 상태를 부모(`vote/page.tsx`의 `expandedId`)로 끌어올려 한 번에 하나만 펼침(radix accordion 동작). `expanded`/`onToggleExpand` prop 추가(필수). 프롬프트 펼침은 잠금해제 후라 내부 상태 유지
- **#4 투표 단계 다음 주제 예고**: `widgets/home/HomeBody.tsx` voting 블록 — 3표 완료 시 `NextTopicCard` 노출, 미완료 시 `LockedNextTopicCard`(blur + "투표 N/3 다 하면 공개"). `nextChallenge`는 이미 `fetchHomeData`가 항상 계산해 prop으로 내려옴
- **신고 기능 보류**: 사용자 지시로 제외. 작업 중 추가했던 `users.is_blocked`/`reports` 스키마 변경은 롤백함. 재개 시 [[project-state]] 이 항목 참고
- **검증**: tsc·ESLint 클린, vitest **69/69**, 프로덕션 빌드 통과. **E2E `vote.spec`·`generate.spec`은 기존 stale** — 페이지가 서버사이드 `/api/vote`·`/api/generate`로 데이터를 받는데 테스트는 브라우저 네트워크 레벨만 mock해 서버→Supabase 호출이 401(로그인 필요)로 떨어짐. 내 변경 무관(HEAD에서도 동일 구조). e2e 실행 시 워커가 `.env.local`만 읽어 storage key를 못 구함 → `.env`의 `NEXT_PUBLIC_SUPABASE_URL`을 env로 주입해 우회([[no-dummy-envlocal]] 준수, 더미 파일 금지)
- **로컬 미검증 배포**: 사용자가 로컬 화면 확인 없이 커밋·배포. 빌드 green이라 기능 위험은 낮고, 미검증은 3개 UI(admin 아코디언/모바일 단일펼침/잠금 예고카드)의 *모양*뿐

### UI 폴리시 (2026-06-16, #2 후속 + 결과 페이지) — tsc 클린

- **공용 애니메이션 아코디언 `ds/accordion.tsx` 신설**: 네이티브 `<details>`는 펼침 애니메이션이 불가능 → `BlindCard`에서 검증된 `grid-rows-[1fr]/[0fr]` + `transition-[grid-template-rows]` 기법(JS 높이측정 불필요)을 컴포넌트로 추출. `trigger`(헤더 컨텐츠 주입)·`defaultOpen`·`variant`(`subtle` 기본/`plain`)·`contentClassName` props. 셰브론은 컴포넌트가 자동으로 붙이고 펼침 시 90° 회전. **`admin/submissions`가 첫 사용처** — 기존 `<details>/<summary>` 마크업을 `<Accordion>`으로 교체(헤더는 `trigger`로 주입, truncate 위해 `min-w-0` 추가). 서버 컴포넌트가 children을 client 래퍼에 넘기는 구조.
- **결과 페이지(`results/page.tsx`·`Podium`·`RankBadge`) 정리**:
  - 시상대 이름 중복 제거 — 원형 배지(`#adf`) 아래 또 있던 `익명#adf` 텍스트 줄 삭제
  - **금·은·동 색을 단일 출처 `lib/rank-colors.ts`(`getMedalColor`)로 추출** → `RankBadge`(하드코딩 oklch를 이 모듈로 치환, 색값 동일)와 `Podium`(파란 accent 일색 → 금/은/동)이 공유. 이제 상단 시상대와 전체순위 색이 일치
  - 전체순위 헤더에 `상위 N개` 표기(`min(출품수, 20)`). 주 쿼리는 이미 `.limit(20)`, 폴백 경로는 순위계산상 전체조회라 계산 후 `rankedSubs.slice(0, 20)`로 상한 일관성 확보
  - 링크 복사(`CopyLinkButton`)를 맨 하단 별도 카드 → **우승작 카드 안 하단**(구분선)으로 이동(사용자 선택). 우승작 없을 때(출품 0)는 같이 비노출 — 빈 상태라 공유 대상 없음

## 현재 상태 (2026-06-12 5차 갱신)

### ⚠️ 배포 전 필수 — 미적용 DB 마이그레이션

```sql
ALTER TABLE submissions ADD COLUMN ai_summary text;
```

투표 API가 `ai_summary`를 select하므로 **이 SQL을 Supabase에 적용한 뒤 push(배포)해야 한다.** 적용 후 이 섹션 삭제.

### TO-DO 처리 (2026-06-15) — `docs/TO-DO/TO-DO.md` 4건

- **#1 프롬프트 보이기**: 생성 화면(`generate/page.tsx`) 활성 결과물 카드에 "내가 보낸 프롬프트" 블록 추가 — 제출 기간에 내가 보낸 프롬프트를 결과물과 함께 노출
- **#2 제출 API 속도(7.5s→대폭 단축)**: `app/api/submit/route.ts` — 챌린지·생성물·중복확인 3조회를 `Promise.all` 병렬화, 코인·뱃지(보상)는 `after()`로 응답 후 처리(왕복 ~10→~4). 부수효과로 코인 적립 실패가 더 이상 제출 응답을 500으로 만들지 않음(우아한 실패). 모든 service-client 조회로 통일
- **#3 집계 전 투표상황 노출 버그**: `results/page.tsx`에서 `getChallengeState`로 게이팅 — `state !== 'results'`(투표 중 등)이면 "아직 결과가 공개되지 않았어요" 화면. 프로필>지난 챌린지의 "집계 전" 항목 링크로 진행 중 순위·득표를 미리 보던 누수 차단. `getChallengeState`/`getNextTransition` 파라미터를 `ChallengeTiming`(기간 4필드 Pick)으로 좁힘
- **#4 제출 횟수 문구 5→3**: generate 화면 placeholder·잠금 버튼이 `MAX_GENERATIONS` 사용("생성 잠금 (3/3)"). (앱 코드의 5회 잔재는 여기뿐이었음 — 나머지는 PRD 문서)
- 검증: vitest 69 passing(submit 테스트 목 재작성 — 병렬조회·after 폴백 반영), Playwright `tests/todo-generate-ui.spec.ts` 2 passing(#1·#4 실화면). e2e helper 쿠키 버그 수정(Playwright 1.60: url+path 동시 금지 → domain+path). 결과 페이지(#3)·제출 속도(#2)는 서버 컴포넌트/라우트라 실DB 없이 e2e 불가 → vitest로 커버. e2e/빌드 검증엔 env가 필요하지만 **더미 `.env.local` 파일을 만들지 말 것**([[no-dummy-envlocal]] 참고).

### v1.2 주기 단축 + 관리자 일정 편집 + 성능 (2026-06-15)

- **PRD v1.2 = 2일 주기** (제출1일 + 투표·결과1일, 투표 마감 자정 직후 즉시 결과). 백엔드 일정 파생은 이미 2일 주기였음 — 제출일 하나로 제출 day0 종일 / 투표 day1 종일 / `voting_end=day1 자정` → 결과 자동(voting_end 이후).
- **기조(중요): 챌린지 생성·수정 모두 "제출일 하나만" 입력 → 나머지(제출마감·투표시작/마감) 2일 주기 자동 파생.** 한때 4시각 직접입력 UI를 넣었다가 사용자가 거부(기조 위반)해 되돌림. 공용 `lib/challenge-schedule.ts`의 `deriveTwoDayISO`+`validateSchedule`를 생성(POST)·수정(PATCH)이 공유. 제출일 기본값: 생성=오늘, 수정=현재 제출 시작일.
- **관리자 일정 수정 기능**: `/admin/challenges/[id]/edit` + `PATCH /api/admin/challenges/[id]`(관리자 전용). 챌린지 관리 목록에 "일정 수정" 버튼.
- **성능**: results·finalize 득표 집계 N+1 제거(제출물별 count → 챌린지 전체 표 1쿼리 후 JS 합산). Vercel 함수 리전 `syd1`(대시보드 설정) — Supabase `ap-southeast-2`(시드니)와 콜로케이트. **느림의 1순위는 함수↔DB 리전 불일치였음.**
- **홈/`is_active`**: 홈은 `is_active=true` 중 상태 우선순위(제출0>투표1>결과2>대기3)로 1개 선택. `is_active`는 공개 노출 스위치(false=홈·아카이브·예고에서 숨김, admin 목록엔 계속 보임). false로 바꾸는 UI는 현재 없음. **끝난 챌린지도 `true` 유지가 정상**(아카이브=지난 챌린지 노출용).

### PRD v1.1 — 투표 피로도 완화 (2026-06-12 구현)

- **AI 중립 요약 (4.6.4)**: 제출 확정 시 `after()`로 응답 후 1회 생성 → `submissions.ai_summary` 저장. 실패 시 null(우아한 실패 — 요약 없이 표시). 시드 제출도 동일 경로. 시스템 프롬프트에 평가 금지(색인만) 명시 (`lib/gemini.ts generateNeutralSummary`, `lib/summary.ts`)
  - (2026-06-12 보강) 챌린지 주제(title+instruction)를 참고 맥락으로 전달 — 주제 내 접근 각도를 색인. 단 주제 적합성·충실도 판단은 우열 암시라 프롬프트에서 명시 금지. 기존 저장된 요약(주제 없이 생성)은 재생성 안 함
- **노출 순서 랜덤화 (4.6.1)**: `lib/shuffle.ts seededShuffle` — `user.id:challengeId` 시드 결정적 셔플. 투표자마다 다르고, 같은 투표자는 재조회에도 순서 고정
- **"전부 볼 필요 없음" 안내 (4.6.2)**: 투표 화면 내 투표 카드에 문구 추가
- **표시**: `components/AiSummary.tsx` — 기본 표시·접기 가능, 색인 톤. BlindCard 상단 + 데스크탑 디테일. 데스크탑 목록 프리뷰는 요약 우선
- 낡은 테스트 정리: generate 5회→3회, finalize 멱등성 가드(.not) 목 보강

### 완료된 작업 전체

#### 기반 인프라
- lint 전량 수정, finalize 멱등성, Vercel Cron 자동 확정
- 어드민 챌린지 생성 시 활성 챌린지 충돌 경고
- DB 초기화 버튼 (admin 대시보드)
- SVG favicon (`app/icon.svg`, accent 색상 #0284c7)

#### 디자인 시스템
- sky-600 accent (OKLCH `oklch(58.8% 0.158 241.966)`), slate 뉴트럴
- Pretendard 자체 호스팅 (`public/fonts/`)
- DS 컴포넌트: Button / Card / Badge / Input / Label / Textarea / Accordion(애니메이션·variant)
- warning(amber) → accent(sky) 전면 통일

#### 레이아웃 셸
- `components/AppBar.tsx`: sticky 52px, 3열 그리드, 우측 컬럼 min-w-[48px]로 제목 진짜 가운데 정렬
- `components/TabBar.tsx`: fixed bottom, usePathname 활성 상태
- `nextjs-toploader`: 페이지 이동 시 상단 프로그레스 바 (sky accent, 2px)

#### 화면 — 사용자
- **홈** (`app/page.tsx` + `lib/home-data.ts`): 제출/투표/결과/공백 4상태 분기. totalVotes service client로 RLS 우회 수정
- **생성** (`app/challenge/[id]/generate/page.tsx`): 3회 한도, instruction 표시
- **투표** (`app/challenge/[id]/vote/page.tsx` + `components/BlindCard.tsx`): 전면 개편
  - 프롬프트 섹션 항상 노출 — 잠금(자물쇠 + n/3 카운터 + 사선 배경)
  - 3표 완료 시 grid-template-rows 트릭으로 잠금 아웃 / 프롬프트 인 슬라이드
  - 결과물 텍스트 5줄 클램프 + 전체보기/접기 (max-height transition)
  - 3표 완료 후 API 재호출로 prompt_text 즉시 반영
- **결과** (`app/challenge/[id]/results/page.tsx` + `ResultList.tsx` + `Podium`): 우승작 프롬프트 직접 표시(카드 안에 링크 복사 포함), 전체 순위 아코디언으로 프롬프트+결과물 열람(상위 20개). 시상대/순위 금·은·동 색은 `lib/rank-colors.ts` 공유
- **아카이브** (`app/archive/page.tsx`): `voting_end_at < now` 필터로 결과 단계 챌린지만 표시
- **프로필** (`app/profile/page.tsx`): 닉네임 인라인 편집, stat 3열, 지난 챌린지/코인 내역(최대 5개 + "전체 내역" 링크). 뱃지 섹션 홀딩
- **코인 전체 내역** (`app/profile/coins/page.tsx`): 날짜별 그룹핑, 시간 표시, 보유 잔액
- **로그인** (`app/auth/login/page.tsx`): Google + 이메일, 하단 약관 링크 추가
- **약관** (`app/terms/page.tsx`): 서비스 이용약관 (10개 조항)
- **개인정보처리방침** (`app/privacy/page.tsx`): 수집 항목·위탁업체 표 포함

#### 화면 — 어드민
- AdminShell: 사이드바 — 대시보드 / 챌린지 관리(`/admin/challenges`) / 시드 제출 / 출품·결과 / 사용자·코인
- 챌린지 관리(`/admin/challenges`): 목록 + 결과 확정 + "새 챌린지 만들기" 버튼
- 대시보드: 통계, 빠른 진입
- 시드 제출: `is_seed=true` 계정만 드롭다운
- 출품 모니터링: 챌린지별 공용 `<Accordion>`(애니메이션, 2026-06-16) + 프롬프트 컬럼, 시드 출품작 제외
- 유저 관리: service client + 시드 토글

#### 기능
- Gemini: `@google/genai` 신 SDK, `thinkingBudget: 0` (응답 1초대)
- 익명성: `user_${id6}` 형태, 닉네임 변경 가능
- 코인: 투표·제출·순위 적립. finalize cron에서 자동 지급
- 뱃지 백엔드: finalize 시 `first_win`, `wins_3`, `votes_30`, `first_submission` 지급
- 공유: CopyLinkButton으로 `/challenge/{id}/results` URL 복사

---

#### 리팩터링 진행 중 (2026-06-11)

구조 개선 작업 3단계로 진행 중. **Step 1 완료, Step 2·3 내일 이어서.**

**배경:** 파일 수 증가로 코드 탐색이 어려워짐. 기술 역할별 분류(app/components/ds/lib)에서 `widgets/` 조합 레이어 추가하는 방향으로 결정.

- **Step 1 완료** — `widgets/` 레이어 추가
  - `components/home/HomeBody.tsx` → `widgets/home/HomeBody.tsx`
  - `HomeBodyProps` 17개 flat → 5개 그룹 객체 (challenge/countdown/stats/user/top3)
  - `TopRankEntry`, `NextChallengePreview` 타입을 `lib/home-data.ts`로 이동 (lib→components 레이어 위반 해소)
  - idle 상태 더미값 제거 (`<HomeBody state="idle" nextChallenge={...} />`)
- **Step 2 예정** — `components/` 서브폴더 그루핑 (nav/, challenge/, vote/, result/ 등)
- **Step 3 예정** — `lib/` 도메인 로직 서브폴더 정리

---

### PRD 기준 미구현 항목

| 항목 | PRD 근거 | 비고 |
|------|---------|------|
| 뱃지 UI (프로필) | F-9 | BadgeList 컴포넌트 있음. DB 지급 로직 있음. 프로필 섹션만 없음. 홀딩 중 |

### 선택적 항목

| 항목 | 상태 |
|------|------|
| 어드민 AI 초안 2컬럼 레이아웃 | 기능 동작, 레이아웃만 미조정 |
| Gemini API 예산 추적 | 포기 (API 잔액 조회 불가) |

**How to apply:** 새 세션 시작 시 미구현 테이블 참고.
