---
name: project-state
description: 프로젝트 현재 상태 스냅샷 — 마지막 업데이트 2026-06-11 (4차)
metadata:
  type: project
---

## 현재 상태 (2026-06-11 4차 갱신)

### 완료된 작업 전체

#### 기반 인프라
- lint 전량 수정, finalize 멱등성, Vercel Cron 자동 확정
- 어드민 챌린지 생성 시 활성 챌린지 충돌 경고
- DB 초기화 버튼 (admin 대시보드)
- SVG favicon (`app/icon.svg`, accent 색상 #0284c7)

#### 디자인 시스템
- sky-600 accent (OKLCH `oklch(58.8% 0.158 241.966)`), slate 뉴트럴
- Pretendard 자체 호스팅 (`public/fonts/`)
- DS 컴포넌트: Button / Card / Badge / Input / Label / Textarea
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
- **결과** (`app/challenge/[id]/results/page.tsx` + `ResultList.tsx`): 우승작 프롬프트 직접 표시, 전체 순위 아코디언으로 프롬프트+결과물 열람
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
- 출품 모니터링: 챌린지별 섹션 그룹핑 + 프롬프트 컬럼
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
