---
name: project-state
description: 프로젝트 현재 상태 스냅샷 — 마지막 업데이트 2026-06-15 (TO-DO 4건 처리)
metadata:
  type: project
---

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
