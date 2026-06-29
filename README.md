# 프롬프트 아레나 (Prompt Arena)

> **AI 프롬프트 경진대회 서비스.** 같은 주제에 각자 프롬프트를 짜서 제출하고, AI가 실행한 결과물을 블라인드로 투표해 순위를 가린다. "내 프롬프트가 잘 짠 건지" 비교·검증·학습할 무대.

> ⚠️ **이 서비스는 2026-06-29 운영을 종료했습니다.** 코드는 보존용으로 남아 있으며, 동일 콘텐츠로 다시 띄우는 방법은 [`docs/RESTART.md`](docs/RESTART.md)를 참고하세요.

---

## 무엇인가

프롬프트 엔지니어링은 필수 역량이 됐지만, **내가 짠 프롬프트가 잘 짠 것인지 가늠할 기준이 없다.** 프롬프트 아레나는 그 기준을 *경쟁과 투표*로 만든다.

핵심 루프:

```
챌린지(주제) 공개 → 프롬프트 작성·실행(Gemini, 최대 3회) → 마음에 드는 결과 1개 제출
   → 블라인드 투표(결과물만 보고 3표) → 투표 마감 후 순위·득표·코인 공개
```

- **블라인드 투표** — 투표 시점엔 결과물만 보인다. 3표를 던지면 *프롬프트가 열람*된다(학습). 순위·득표는 마감 후 공개(밴드왜건 방지).
- **2일 주기** — 제출 1일 + 투표·결과 1일. 투표 마감(자정) 직후 즉시 결과.
- **데일리 O/X 퀴즈 + 연승** — 챌린지 사이 빈 시간을 채우는 미니게임. 하루 1문항, 연승으로 매일 올 이유를 만든다.
- **코인 경제** — 투표·제출·순위로 적립. 첫 사용처는 *퀴즈 연승 회복*(틀려서 끊긴 연승을 코인으로 되살림).

자세한 제품 의사결정과 근거는 [`docs/PRD/`](docs/PRD/) (v1.0 → v1.4)에 있다.

## 이 프로젝트의 성격

단순한 사이드 프로젝트가 아니라 **"AI 주도 개발 프로세스 자체를 설계·검증하는" 실험**이다. 의사결정·설계·컨벤션·구현을 AI가 주도하고 사람이 방향을 잡는다. 그래서 컨벤션 문서들이 스타일 가이드가 아니라 *AI와 사람이 같은 기준으로 협업하기 위한 공유 언어*로 쓰였다. → [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`CLAUDE.md`](CLAUDE.md)

## 기술 스택

| 영역 | 사용 |
|---|---|
| 프레임워크 | Next.js 16 (App Router) · React 19 |
| 언어 | TypeScript |
| DB · 인증 | Supabase (Postgres + RLS, Google OAuth) |
| AI | Google Gemini (`gemini-2.5-flash`) |
| 스타일 | Tailwind CSS v4 (토큰 기반 디자인 시스템 `ds/`) |
| 테스트 | Vitest (단위) · Playwright (E2E) |
| 배포 | Vercel (Cron으로 챌린지 마감·정산 자동화) |

## 폴더 구조

기능(도메인)이 아니라 **기술 역할별**로 나눈다. (근거: `docs/ARCHITECTURE.md` §1)

```
app/          라우트·페이지·API 라우트 (Next App Router). 라우트 전용 UI·훅은 colocate
components/   2개 이상 라우트에서 공유되는 UI
ds/           디자인 프리미티브 (Button, Card, Input, Icon, Modal …) — 도메인 무지
lib/          순수 유틸·외부 클라이언트·도메인 로직 (ai · challenge · coin · quiz · supabase …)
docs/         PRD · 아키텍처 · 재시작 가이드
supabase/     schema.sql · 마이그레이션 · 콘텐츠 재시드 SQL
scripts/      DB 백업 스크립트
```

## 로컬 실행

```bash
npm install
npm run dev      # http://localhost:3000
```

환경변수는 [`.env.example`](.env.example)를 참고해 `.env`를 채운다. Supabase URL/키, Gemini API 키, `CRON_SECRET`이 필요하다. (DB 구조는 `supabase/schema.sql` 1회 실행으로 생성.)

```bash
npm run build    # 프로덕션 빌드
npm test         # Vitest
npm run test:e2e # Playwright
```

## 다시 띄우려면

서비스 종료 시 유저 데이터(PII)는 폐기하고 **콘텐츠(챌린지·30일 퀴즈)만 보존**했다. 새 Supabase에 `schema.sql` → `restore-content.sql`을 순서대로 실행하면 완전 초기상태에서 동일 콘텐츠로 복원된다. 전체 절차: **[`docs/RESTART.md`](docs/RESTART.md)**
