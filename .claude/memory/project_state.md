---
name: project-state
description: 프로젝트 현재 상태 스냅샷 — 마지막 업데이트 2026-06-10
metadata:
  type: project
---

## 현재 상태 (2026-06-10)

### 완료된 작업

#### 기반
- lint 전량 수정, finalize 멱등성, Vercel Cron, is_seed 필터 제거
- 어드민 챌린지 생성 시 활성 챌린지 충돌 경고
- DB 초기화 버튼 (admin 대시보드)

#### 디자인 시스템 (`cd2cca1`)
- sky-600 accent (OKLCH), slate 뉴트럴
- Pretendard 자체 호스팅 (`public/fonts/`)
- DS 컴포넌트 Button/Card/Badge 업데이트

#### 레이아웃 셸 (`3cf56f5`)
- AppBar (`components/AppBar.tsx`): 52px, 3열 그리드, showBack/statusLabel prop
- TabBar (`components/TabBar.tsx`): fixed bottom, usePathname 활성 상태
- 홈/아카이브/프로필: Header → AppBar+TabBar 교체

#### 색상 통일 (`47a1829`)
- warning(amber) → accent(sky) 전면 수정
- archive/admin state badge, profile rank, challenge-state.ts

#### 디자인 핸드오프 반영 (`1c5bbf1` — Cursor 작업)
- **홈 페이지** (`app/page.tsx` + `HomeBody.tsx` + `lib/home-data.ts`): 상태별 4뷰 분기 완성
  - 제출/투표/결과/공백 상태마다 적절한 카드 구성
  - TopicCard, CountdownCard, StatsRow, VoteTokens, UserStatusCard
- **생성 페이지** (`app/challenge/[id]/generate/page.tsx`): 완성
  - TopicBanner, RunControl(textarea+실행버튼), GenPips, 빈 상태/결과 카드, 히스토리 횡스크롤, 제출 바텀시트
- **투표 페이지** (`app/challenge/[id]/vote/page.tsx`): 완성
  - VoteHeader(pip 토큰), BlindCard 피드, 3표 완료 잠금 해제
- **결과 페이지** (`app/challenge/[id]/results/page.tsx`): 완성
  - Podium(2·1·3 순서, 1위=sky채움), 우승작 카드, 전체 순위, 공유 링크
- **관리자** (`components/admin/AdminShell.tsx`): 사이드바 셸 완성
  - 210px 사이드바 nav, 5개 메뉴, sky accent active state
  - 대시보드/챌린지관리/시드제출/출품결과/사용자코인 페이지 기본 완성

---

### 남은 디자인 작업

디자인 레퍼런스: `docs/design_handoff_prompt_arena/screens/` (PNG 스크린샷)
채택 레이아웃: 모든 화면 A안 고정

#### 남은 항목

**로그인 페이지** (`app/auth/login/`)
- 카카오 버튼: `#FEE500` 배경, `#181600` 글자
- 네이버 버튼: `#03C75A` 배경, 흰 글자
- 현재 구글 소셜 + 이메일 폼이 있는 구조 → 디자인 문서 레이아웃에 맞춰 스타일

**프로필 페이지** (`app/profile/page.tsx`)
- 현재 구 레이아웃(`container` 클래스, 통계그리드 등) 그대로
- 디자인: 익명#me7 아바타 + 코인/순위/응모 stat 3열 + 지난 챌린지 목록 compact + 코인 내역 compact

**관리자 챌린지 출제** (`app/admin/challenges/new/page.tsx`)
- 현재 폼 구조는 있음
- 디자인: AI 초안 채팅(좌) + 운영자 확정 폼(우) 2컬럼 레이아웃 (선택적 - 현재도 기능적으로 동작함)

---

## 기타 미결 항목 (기능/버그)
- 예산 추적: Gemini API 비용 DB 미구현 (admin 대시보드 placeholder)

**Why:** 화면마다 독립적으로 진행하므로 순서·범위 명시.
**How to apply:** 새 세션 시작 시 "남은 항목부터" 또는 특정 화면 지정해서 진행.
