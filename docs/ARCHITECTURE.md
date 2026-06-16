# 아키텍처 & 컨벤션

> **위상:** 이 문서는 `CLAUDE.md`의 "Code Conventions"를 **확장·구체화**한다. 충돌 시 이 문서가 더 자세한 쪽이며, 두 문서는 같은 방향을 가리킨다. AI·사람이 같은 기준으로 협업하기 위한 **공유 언어**다 (프로젝트 철학).
>
> **작성 배경:** MVP를 기능 단위로 빠르게 쌓는 과정에서 "작동만 되게" 패턴이 누적됐다. 이 문서는 그 부채를 정리할 **타깃 아키텍처를 먼저 못박고**, 거기로 코드를 수렴시키기 위한 기준이다. (먼저 문서, 그다음 단계별 리팩토링.)

---

## 0. 현황 진단 (왜 이 문서가 필요한가)

감사에서 드러난 "작동만" 흔적 (증거 일부):

- **클라이언트가 supabase를 직접 호출** — 9개 파일이 `@/lib/supabase/client` import. 인증 외에 `generate`·`vote`·`admin/*` 페이지가 클라에서 DB를 읽음. 예: `app/challenge/[id]/generate/page.tsx:54-83`이 challenges·generations·submissions·categories를 클라에서 4연속 쿼리.
- **useState 폭발, 훅 0개** — `generate` 12개, `QuizClient` 11개, `vote` 10개, `admin/seed` 14개. 커스텀 훅·`hooks/` 폴더 부재. 로딩·에러·폼 상태를 매번 손으로 깐다.
- **아이콘 무체계** — 인라인 SVG 22개(11파일) + 파일 내부 `const XxxIcon` 7개 + 이모지 혼용. 같은 자물쇠 아이콘이 4번, 뒤로가기·체크가 2번씩 재작성됨. 공유 아이콘 모듈 없음.
- **모달 중복** — `generate` 확인 모달(`:313`), `quiz/RecoverModal`, `vote` 페이지가 각자 ad-hoc 모달. ds 프리미티브 없음.
- **스타일 시스템 2개 병존** — 살아있는 코드는 Tailwind 토큰(`text-text-primary`), 죽은 컴포넌트군은 인라인 `style={{ var(--accent) }}`. 그 탓에 `globals.css`가 색 토큰을 **2벌** 유지.
- **죽은 코드 6개** — `components/`의 `VoteCard`·`CoinDisplay`·`SubmissionCard`·`Header`·`AuthGuard`·`ChallengeHero`가 어디서도 import되지 않음. (`BadgeList`는 보류된 뱃지 UI 기능이라 유지. `TopicCard`·`CountdownCard`·`CountdownTimer`는 `HomeBody`가 사용 중 — 살아있음.)
- **도메인 상수 분산** — 코인 `reason`이 호출부마다 한글 리터럴(`'퀴즈 정답'`, `` `${rank}등 보상` `` 등). KST 날짜 변환이 22개 파일에 산재.

---

## 1. 아키텍처 모델 — 역할별 레이어 (두껍게)

**결정:** 기능(FSD/`features/`) 단위가 **아니라** 기술 역할별 분류를 유지한다. 이 규모(소스 ~5천 줄, 1인+AI)에선 FSD 전환 비용이 이득을 넘는다. 대신 그동안 비어 있던 칸을 채워 **두껍게** 만든다.

| 레이어 | 역할 | 입주 기준 |
|---|---|---|
| `app/` | 라우트·페이지·API 라우트 (Next App Router) | URL에 1:1 대응하는 것 + 그 라우트 **전용** UI·훅 (colocate) |
| `ds/` | 디자인 프리미티브 (Button, Card, Input, **Icon**, **Modal** …) | 색·크기·variant를 갖는 UI 원자. 도메인 무지(domain-agnostic) |
| `components/` | **2개 이상 라우트**에서 공유되는 UI | 진짜 공유만. 단일 라우트 전용이면 `app/<route>/`로 colocate |
| `hooks/` *(신설)* | **2개 이상**에서 쓰는 클라이언트 훅 | 단일 라우트 전용 훅은 `app/<route>/use*.ts`로 colocate |
| `lib/` | 순수 유틸·외부 클라이언트·도메인 로직 | 아래 §1.1 도메인 분리 규칙 |

### 1.1 `lib/` 내부 도메인 분리

`features/` 금지는 유지하되, `lib/` 안에서는 도메인별 하위 폴더를 **허용**한다 (lib은 라우트가 아니라 로직 계층이므로 철학과 충돌하지 않음).

```
lib/
  utils.ts, shuffle.ts, constants.ts   ← 순수 유틸 (도메인 무지)
  time.ts                               ← KST 경계 단일 헬퍼 (신설)
  supabase/                             ← 외부 클라이언트
  challenge/   challenge-state, challenge-schedule, finalize, home-data, ranking
  coin/        amounts(상수), ledger(awardCoins), recovery
  quiz/        streak(계산), scoring, recovery, data(조회)
  ai/          gemini, summary
```

- **단일 책임:** 한 파일이 상수 + 비즈니스 로직 + DB 쓰기를 동시에 갖지 않는다. 예: 현재 `coins.ts`(상수+`awardCoins`+뱃지)와 `quiz.ts`(331줄: 계산+회복+채점+조회)를 위 구조로 분해.

### 1.2 컴포넌트 파일 내부 조직

- 한 파일 = **메인 컴포넌트(상단) + 그 파일 전용 서브컴포넌트(하단)**. `function` 호이스팅을 활용해 위→아래로 읽히게 배치 (모범: `ds/accordion.tsx`의 `Chevron`).
- 파일 전용이 아니라 재사용되면 → `components/`(2곳+) 또는 같은 라우트 내 별도 파일로 승격.
- 인라인 SVG·아이콘은 **금지** (§3).

---

## 2. 데이터 접근 — 가장 중요한 규칙

> **원칙: 클라이언트는 데이터베이스의 진실을 직접 만지지 않는다. 모든 판정·쓰기는 서버에서.** (PRD 10.2와 일치.)

### 2.1 쓰기 (mutation)

- **클라이언트에서 supabase로 직접 INSERT/UPDATE/DELETE 금지.** 모든 변경은 `app/api/*` 라우트 핸들러를 거친다 (이미 `submit`·`vote`·`quiz`가 이 패턴).
- 라우트 핸들러가 인증·기간·한도를 **서버 시각·service-role**로 재판정한다.

### 2.2 읽기 (read)

**고정선:** 클라이언트에서 supabase 직접 read 금지 (인증 §2.3 제외). 그 위에서 서버 컴포넌트 vs `/api` 엔드포인트는 **상황에 따라 적절히** 고른다 — 판단 기준:

- **서버 컴포넌트 (기본):** 라우트 진입 시 한 번 필요한 *초기 데이터*. SSR로 내려 클라이언트 island에 props (모범: `app/quiz/page.tsx` → `QuizClient`).
- **`/api` read 엔드포인트:** 풀 내비게이션 없이 *클라이언트 인터랙션에 반응해 다시 읽어야* 하는 데이터. (예: 투표 3표 완료 후 프롬프트 열람 해제분 재조회 — 이미 이 패턴 존재.)
- **변경의 새 상태는 mutation 응답으로:** 쓰기 후 갱신분은 별도 read 대신 그 `/api` 라우트의 응답에 담아 돌려준다 (왕복 절감. `submit`·`quiz`가 이미 이 방식).
- 예: `generate/page.tsx`의 클라 4연속 read는 *초기 데이터*이므로 **서버 컴포넌트로 이전**, 실행·제출만 하는 클라이언트 island로 분리한다.

### 2.3 유일한 예외 — 인증

- `supabase.auth.*`(getUser / signIn / signOut)만 클라이언트에서 허용 (`login`, `LogoutButton`, `auth/callback`). 그 외 테이블 접근은 클라에서 하지 않는다.

---

## 3. UI 프리미티브 & 아이콘

### 3.1 아이콘 — `ds/icons.tsx` 단일 출처 (신설)

- **UI 크롬 아이콘**(lock, back-arrow, check, chevron, home, clock, person, google, logout …)은 전부 `ds/icons.tsx`에서 export. **인라인 SVG·파일 내부 `const XxxIcon` 금지.**
- 각 아이콘은 `function` 컴포넌트, `ref`는 일반 prop, 크기·색은 `className`/props로. `currentColor` 사용.
- 중복부터 흡수: lock(4곳), back-arrow(2곳), check(2곳), chevron(`accordion`).

### 3.2 이모지 정책

- **허용:** 콘텐츠·감정 표현 글리프 (🔥 연승, 🏆 우승, 🎉/🛡️/💔 결과 피드백, 🌙 빈 상태). 의미가 텍스트성인 경우.
- **금지:** UI 컨트롤·내비게이션 아이콘을 이모지로 대체 (이건 `ds/icons`). 장식 글리프(`✦`, `✓`)의 하드코딩 반복 금지 → 아이콘/상수화.

### 3.3 모달 — `ds/modal.tsx` 단일 프리미티브 (신설)

- 현재 ad-hoc 모달 3곳(`generate` 확인, `quiz/RecoverModal`, `vote`)을 하나의 `ds/modal`(오버레이·포커스·`role="dialog"`·닫기)로 통일. 내용만 주입.

---

## 4. 클라이언트 상태 & 훅

> **증상:** 한 컴포넌트가 useState 10~14개 + 생짜 `fetch` + 수동 loading/error/cancelled. **지난 세션 v1.4의 `QuizClient`(useState 11)가 대표 사례** — 이 문서의 1순위 리팩토링 대상.

### 4.1 규칙

- **컴포넌트 useState는 가이드상 ~5개 이내.** 그 이상이면 **도메인 훅으로 추출**한다.
- **도메인 훅 `use<Domain>`** 이 fetch + 상태 머신을 캡슐화한다. 컴포넌트는 훅이 돌려주는 상태·액션만 렌더에 쓴다.
  - `useGeneration(challengeId)` → `{ challenge, generations, generate(), submit(), loading, error, … }`
  - `useQuizGame(initial)` → `{ answered, result, streak, recover(), dismiss(), … }`
  - `useVoting(challengeId)` → `{ submissions, votesUsed, vote(), revealed, … }`
- 훅 안의 fetch도 **§2 데이터 규칙**을 따른다 (`/api` 경유, 직접 supabase 금지).

### 4.2 위치

- 2곳+ 공유 훅 → `hooks/`. 단일 라우트 전용 훅 → `app/<route>/use*.ts` (components colocation 규칙과 대칭).

---

## 5. 스타일 토큰 단일화

- **두 토큰 세트는 "값은 같지만 역할이 다른" 의도된 2벌이다 (P5에서 검증·정정).** ~~두 번째 세트는 삭제 대상~~ → **삭제 불가**:
  - `@theme inline` 블록 = **유틸리티 생성용**. `inline`이라 값이 유틸에 직접 박히고(`.bg-bg-base{background:#f1f5f9}`) `--color-*` CSS 변수를 **:root에 emit하지 않는다**(컴파일 CSS로 확인).
  - 두 번째 `:root` 세트 = **런타임 `var()` 참조의 단일 출처**. 유틸이 못 닿는 곳이 쓴다: ① 생짜 CSS(`body`·`::-webkit-scrollbar`) ② Tailwind 임의값 속 `color-mix`(`bg-[color-mix(…var(--success)…)]` — badge·alert 다수, 앱 전반 라이브). 지우면 런타임에 깨짐(tsc/build/test는 CSS 런타임 미감지).
  - `@theme`를 `inline` 없이 쓰면 `--color-*`를 emit하지만 `var(--accent)` 체인이 `@layer theme` 기본값에 덮여 sky 토큰 누락 → 그래서 `inline`+`:root` 조합. 두 세트는 **값 동기화로 유지**(globals.css 상단 주석에 근거 명문화).
- **인라인 `style={{ color: 'var(--*)' }}` 금지(동적 값 제외).** Tailwind 토큰 유틸(`text-text-primary` 등)만 사용. `Podium`은 P5에서 고정색을 토큰 유틸로 전환, 동적 메달 oklch(`getMedalColor`)만 인라인 잔류(유틸로 표현 불가).
- `lib/.../rank-colors`의 하드코딩 oklch는 토큰을 참조하도록 정리.

---

## 6. 도메인 상수·헬퍼 단일화

- **코인 reason 상수화:** `lib/coin`에 `CoinReason` 타입 + 상수 객체. `awardCoins(reason: CoinReason)`로 시그니처를 좁힘. PRD 6.1 라벨 체계(적립/사용·출처)와 정렬 → **A-9 코인 경제 모니터링이 reason별 집계로 깔끔해짐.**
- **KST 날짜 헬퍼:** `lib/time.ts`에 자정 경계·`kstToday` 단일화 (현재 `quiz.ts`·`challenge-schedule.ts`·22개 파일 산재).

---

## 7. 코드 스타일 (명문화)

- **함수 스타일 (확정):**
  - React 컴포넌트 → `function` 선언 (DevTools 이름·스택트레이스·호이스팅. CLAUDE.md 근거 유지).
  - **그 외(유틸·헬퍼·서비스·데이터 함수·인라인 콜백)는 예외 없이 화살표 `const`.** async·DB 접근 함수도 포함. 근거: ① "이 줄은 컴포넌트가 아니다"라는 신호가 일관됨 ② 값(value)으로서의 함수 의도 ③ 규칙에 예외를 두면 다시 새기 시작함 — 일관성이 컨벤션의 본질.
  - 따라서 현재 `lib/`의 `export function …`(약 12곳: `finalize`, `home-data`, `coins`, `gemini`, `challenge-state`, `supabase/*` 등)은 **화살표로 변환**한다 (P5 스타일 스윕). 파일 내 전방 참조가 있으면 선언 순서를 조정.
  - `ds/accordion.tsx`의 `const XxxIcon`처럼 JSX를 반환하면 = 컴포넌트이므로 `function`으로 (이건 화살표 금지 쪽).
- **import 스타일:** 세미콜론 없음 + 작은따옴표. 이탈자(`ds/accordion.tsx`, `app/layout.tsx`)는 교정.
- **파일명:** `components/`=PascalCase(`BlindCard.tsx`), `ds/`·`lib/`=kebab-case(`button.tsx`, `rank-colors.ts`). 명문화.

---

## 8. 폐기 대상 (dead code) — 검증 완료

저장소 전체 grep으로 import 0건 확인 (git 이력에 남으니 삭제 안전):
`VoteCard` · `CoinDisplay` · `SubmissionCard` · `Header` · `AuthGuard` · `ChallengeHero`.

- **유지:** `BadgeList` — 보류된 뱃지 UI 기능(메모리 기록). 죽은 게 아니라 미착수.
- **삭제 금지(살아있음):** `TopicCard`·`CountdownCard`·`CountdownTimer` — `HomeBody`가 사용. (초기 감사가 오판한 항목 — 검증으로 교정.)
- `globals.css`의 2번째 색 토큰 세트는 **영구 유지**(애초 "Podium만 쓴다"는 가정이 틀렸음 — P5 검증). `@theme inline`이 `--color-*` var를 emit 안 해서, 생짜 CSS·`color-mix` 임의값(badge·alert·body·scrollbar)이 이 세트를 런타임 var로 참조한다. 자세한 근거 §5 참고. (Podium 인라인 var는 P5에서 제거 완료.)

---

## 9. 리팩토링 로드맵 (각 단계 빌드 그린·독립 배포 가능)

| 단계 | 내용 | 위험 |
|---|---|---|
| **P0** | **이 문서 확정** (현재 단계) | — |
| **P1** | 죽은 코드 6개 삭제 (§8). 토큰 세트 제거는 P5로 이관(Podium 의존) | 낮음 (미사용 삭제) |
| **P2** | 데이터 접근: 클라 supabase read/write 제거 → 서버 컴포넌트/`/api`. `generate`부터 | 중 (동작 동치 검증 필요) |
| **P3** | 훅 추출: `QuizClient`(내가 만든 빚) → `generate` → `vote`. useState 뭉치 → `use<Domain>` | 중 |
| **P4** | `ds/icons.tsx` + `ds/modal.tsx` 신설, 인라인 SVG·ad-hoc 모달 흡수 | 낮음 |
| **P5** | 토큰 단일화 + import/파일명 교정 + **lib `export function`→화살표 스윕** + 코인 reason 상수 + `lib/time` | 낮음 |
| **P6** | 폴더 수렴: `hooks/`, `lib/<domain>/`, components colocation, `coins.ts`·`quiz.ts` 분해 | 중 (대량 이동·import 갱신) |

> **A-9(코인 경제 모니터링)는 P5의 reason 상수화 이후** 착수하면 reason별 집계가 깔끔하다.

---

## 미결 결정 — 모두 확정됨

1. ~~함수 스타일~~ — **확정: 비컴포넌트는 예외 없이 화살표 `const`** (§7). lib의 `export function`은 P5에서 변환.
2. ~~P2 읽기 이전 방식~~ — **확정: 고정선(클라 직접 supabase read 금지) 위에서 서버 컴포넌트(초기 데이터) vs `/api`(인터랙션 갱신)를 §2.2 기준으로 케이스별 선택.**

→ 컨벤션 확정. 다음: `CLAUDE.md`에 `@docs/ARCHITECTURE.md` 연결 후 P1(죽은 코드 삭제)부터 착수.
