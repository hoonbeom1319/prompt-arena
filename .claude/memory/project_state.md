---
name: project-state
description: 프로젝트 현재 상태 스냅샷 — 마지막 업데이트 2026-06-10
metadata:
  type: project
---

## 현재 상태 (2026-06-10)

### 완료된 기반 작업
- lint 전량 수정, finalize 멱등성, Vercel Cron, is_seed 필터 제거
- 어드민 챌린지 생성 시 활성 챌린지 충돌 경고
- DB 초기화 버튼 (admin 대시보드)
- **디자인 토큰 교체** (commit `cd2cca1`):
  - sky-600 accent (OKLCH), slate 뉴트럴
  - Pretendard 자체 호스팅 (`public/fonts/`)
  - DS 컴포넌트 Button/Card/Badge 업데이트
  - ChallengeHero: gradient 제거 + phase strip
- **레이아웃 셸** (commit `3cf56f5`):
  - AppBar (`components/AppBar.tsx`): 52px, 3열 그리드, showBack/statusLabel prop
  - TabBar (`components/TabBar.tsx`): fixed bottom, usePathname 활성 상태
  - 홈/아카이브/프로필: Header → AppBar+TabBar 교체

### 남은 디자인 작업 — 하나씩 진행 예정

디자인 레퍼런스: `docs/design_handoff_prompt_arena/screens/` (PNG 스크린샷)
채택 레이아웃: 모든 화면 A안 고정

#### ~~1순위 완료~~ → 2순위부터 시작

#### 2순위 — 홈 페이지 (`app/page.tsx`)
현재: AppBar("프롬프트 아레나" + 상태칩) + 구 컨텐츠 + TabBar
목표: AppBar + 스크롤 본문(상태별 카드 구성) + TabBar

본문 구성 (상태별):
- **제출 기간**: TopicCard("글쓰기" 카테고리칩 + 챌린지 제목 큰따옴표) → CountdownCard(eyebrow + 38px/800 숫자) → StatsRow(참가자/성립기준/내시도) → UserStatusCard → CTA [프롬프트 만들기] + [내 제출 보기]
- **투표 기간**: TopicCard → VoteStatusCard(내 투표 N/3 + pip 토큰) → StatsRow(출품작/누적투표) → UserStatusCard → CTA [투표하러 가기]
- **결과 기간**: TopicCard → TOP3 카드(rank badge + 익명# + 표수) → UserStatusCard → CTA [전체 결과 보기] → NextTopicCard
- **공백**: 빈 화면 + [지난 결과 보기]
- 제거: "어떻게 참여하나요?", "코인 보상", "최근 챌린지" 섹션

#### 3순위 — 프롬프트 생성 페이지 (`app/challenge/[id]/generate/page.tsx`)
- AppBar: 뒤로가기 + "프롬프트 만들기" + "제출 기간" 칩
- TopicBanner: flat card (주제·카테고리 + 제목 + "단독 생성형" 칩)
- RunControl: textarea + "⚡ 실행 (Gemini)" 버튼
- GenCounter: "남은 생성 횟수" eyebrow + gen pips (18×5px 막대 5개, 사용분=sky)
- 결과 없을 때: 번개 아이콘 + "실행하면 결과물이 여기에 표시돼요" 빈 상태
- 결과 있을 때: 결과물 카드(.output) + 시도 히스토리 횡스크롤 + "이 시도 제출하기" CTA

#### 4순위 — 투표 페이지 (`app/challenge/[id]/vote/page.tsx`)
- AppBar: 뒤로가기 + "투표" + "투표 기간" 칩
- VoteHeader: "내 투표 N/3" + pip 토큰 (○○○, 사용분=sky filled)
  - "3표 완료 — 전체 프롬프트 열람이 해제됐어요" (accent 상태)
- BlindCard: "👁 작성자·프롬프트 가림" veil + "출품 #id"
  - "✦ GEMINI 결과물" 라벨 + 결과 텍스트
  - [자세히] (outline) + [✓ 투표] (primary) 버튼 나란히

#### 5순위 — 결과 페이지 (`app/challenge/[id]/results/page.tsx`)
- AppBar: 뒤로가기 + "결과 · 순위" + "결과 발표" 칩
- 트로피 아이콘 + "최종 결과" h-xl + 챌린지 제목 작게
- Podium 컴포넌트: [2위][1위][3위] 순서, 1위 블록=sky 채움, 2/3위=회색
- 우승작 카드: "✦ GEMINI 결과물" + 결과물 텍스트 + "결과물·프롬프트 전체 보기 →"
- 전체 순위 리스트 (rankb 배지: r1=금, r2=은, r3=동)
- 공유 링크 카드

#### 6순위 — 관리자 페이지 (데스크톱 레이아웃)
스크린샷: `screens/10-admin-dashboard.png`, `screens/11-admin-create.png`
- macOS 스타일 윈도우 크롬 (traffic light + 주소창)
- 좌측 사이드바 (210px): 운영자 브랜드 + 5개 메뉴 (대시보드/챌린지출제/시드제출/출품결과/사용자코인)
- 대시보드: stat grid 4개 + 예산 미터 + 빠른진입 버튼 + 챌린지 상태 테이블
- 챌린지 출제: AI 초안 채팅(좌) + 운영자 확정 폼(우) 2컬럼 레이아웃

---

## 기타 미결 항목
- 로그인 페이지: 카카오/네이버 소셜 버튼 스타일 (#FEE500, #03C75A)
- 프로필 페이지: 코인 잔액 + 뱃지 + 내 제출 목록

**Why:** 화면마다 독립적으로 진행하므로 순서·범위 명시.
**How to apply:** 새 세션 시작 시 "1순위부터" 또는 특정 화면 지정해서 진행.

#### 2순위 — 홈 페이지 (`app/page.tsx`)
현재: Header + 히어로 + "어떻게 참여?" + 코인보상 + 최근챌린지
목표: AppBar("프롬프트 아레나" + 상태칩) + 스크롤 본문 + TabBar

본문 구성 (상태별):
- **제출 기간**: TopicCard("글쓰기" 카테고리칩 + 챌린지 제목 큰따옴표) → CountdownCard(eyebrow + 38px/800 숫자) → StatsRow(참가자/성립기준/내시도) → UserStatusCard → CTA [프롬프트 만들기] + [내 제출 보기]
- **투표 기간**: TopicCard → VoteStatusCard(내 투표 N/3 + pip 토큰) → StatsRow(출품작/누적투표) → UserStatusCard → CTA [투표하러 가기]
- **결과 기간**: TopicCard → TOP3 카드(rank badge + 익명# + 표수) → UserStatusCard → CTA [전체 결과 보기] → NextTopicCard
- **공백**: 빈 화면 + [지난 결과 보기]
- 제거: "어떻게 참여하나요?", "코인 보상", "최근 챌린지" 섹션

#### 3순위 — 프롬프트 생성 페이지 (`app/challenge/[id]/generate/page.tsx`)
- AppBar: 뒤로가기 + "프롬프트 만들기" + "제출 기간" 칩
- TopicBanner: flat card (주제·카테고리 + 제목 + "단독 생성형" 칩)
- RunControl: textarea + "⚡ 실행 (Gemini)" 버튼
- GenCounter: "남은 생성 횟수" eyebrow + gen pips (18×5px 막대 5개, 사용분=sky)
- 결과 없을 때: 번개 아이콘 + "실행하면 결과물이 여기에 표시돼요" 빈 상태
- 결과 있을 때: 결과물 카드(.output) + 시도 히스토리 횡스크롤 + "이 시도 제출하기" CTA

#### 4순위 — 투표 페이지 (`app/challenge/[id]/vote/page.tsx`)
- AppBar: 뒤로가기 + "투표" + "투표 기간" 칩
- VoteHeader: "내 투표 N/3" + pip 토큰 (○○○, 사용분=sky filled)
  - "3표 완료 — 전체 프롬프트 열람이 해제됐어요" (accent 상태)
- BlindCard: "👁 작성자·프롬프트 가림" veil + "출품 #id"
  - "✦ GEMINI 결과물" 라벨 + 결과 텍스트
  - [자세히] (outline) + [✓ 투표] (primary) 버튼 나란히

#### 5순위 — 결과 페이지 (`app/challenge/[id]/results/page.tsx`)
- AppBar: 뒤로가기 + "결과 · 순위" + "결과 발표" 칩
- 트로피 아이콘 + "최종 결과" h-xl + 챌린지 제목 작게
- Podium 컴포넌트: [2위][1위][3위] 순서, 1위 블록=sky 채움, 2/3위=회색
- 우승작 카드: "✦ GEMINI 결과물" + 결과물 텍스트 + "결과물·프롬프트 전체 보기 →"
- 전체 순위 리스트 (rankb 배지: r1=금, r2=은, r3=동)
- 공유 링크 카드

#### 6순위 — 관리자 페이지 (데스크톱 레이아웃)
스크린샷: `screens/10-admin-dashboard.png`, `screens/11-admin-create.png`
- macOS 스타일 윈도우 크롬 (traffic light + 주소창)
- 좌측 사이드바 (210px): 운영자 브랜드 + 5개 메뉴 (대시보드/챌린지출제/시드제출/출품결과/사용자코인)
- 대시보드: stat grid 4개 + 예산 미터 + 빠른진입 버튼 + 챌린지 상태 테이블
- 챌린지 출제: AI 초안 채팅(좌) + 운영자 확정 폼(우) 2컬럼 레이아웃

---

## 기타 미결 항목
- 로그인 페이지: 카카오/네이버 소셜 버튼 스타일 (#FEE500, #03C75A)
- 프로필 페이지: 코인 잔액 + 뱃지 + 내 제출 목록

**Why:** 화면마다 독립적으로 진행하므로 순서·범위 명시.
**How to apply:** 새 세션 시작 시 "1순위부터" 또는 특정 화면 지정해서 진행.
