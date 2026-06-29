# 서비스 재시작 가이드

> **상태:** Prompt Arena 서비스는 **2026-06-29 종료**됨. 운영 DB의 유저 데이터(계정·이메일·생성 프롬프트·투표·코인·연승)는 백업하지 않고 폐기했다. 콘텐츠(챌린지·30일 퀴즈)만 PII 없이 보존했다.
>
> 이 문서는 나중에 **완전 초기상태**에서 같은 콘텐츠로 서비스를 다시 올리는 절차다.

---

## 0. 무엇이 보존되어 있나

| 자산 | 위치 | PII |
|---|---|---|
| 전체 스키마 (테이블·RLS·기본 카테고리/뱃지 시드) | `supabase/schema.sql` | 없음 |
| 콘텐츠 재시드 (챌린지 5 + 30일 퀴즈 30) | `supabase/restore-content.sql` | 없음 |
| 콘텐츠 원본 JSON | `db-backup/content-seed/` *(gitignore — 로컬 전용)* | 없음 |
| 백업 스크립트 | `scripts/backup-db.mjs`, `scripts/backup-content.mjs` | — |

> ⚠️ 유저 데이터는 **존재하지 않는다.** users·generations·submissions·votes·coin_transactions·user_badges·quiz_answers·streaks 는 빈 상태에서 시작한다.

---

## 1. 새 Supabase 프로젝트 준비

1. [supabase.com](https://supabase.com) → 새 프로젝트 생성.
2. 프로젝트의 URL / publishable key / secret key 확보.
3. Google OAuth 로그인을 쓰므로 Authentication → Providers → **Google** 설정 (clientId/secret + redirect URL).

## 2. DB 구조 + 기본 시드

SQL Editor에서 **순서대로 한 번씩** 실행:

```
1) supabase/schema.sql          -- 테이블 + RLS + 기본 카테고리/뱃지
2) supabase/restore-content.sql -- 챌린지 + 30일 퀴즈 복원
```

- `schema.sql`은 **새 DB에 1회만.** 재실행 금지(기존 policy 충돌).
- `migrate-v1.3-quiz.sql` / `migrate-v1.4-streak-recovery.sql`은 **기존 운영 DB 증분 적용용** → 새 DB에는 불필요(schema.sql에 이미 포함됨).
- `restore-content.sql`은 `on conflict do nothing`이라 재실행해도 안전.

> 챌린지의 제출/투표 기간(`submission_*`·`voting_*`)은 과거(2026-06) 날짜 그대로 들어간다. 재오픈 시 admin에서 날짜를 새로 잡을 것.

## 3. 환경변수 (`.env`)

`.env.example` 참고. 새 프로젝트 값으로 채운다:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...
NEXT_PUBLIC_SITE_URL=...
GEMINI_API_KEY=...
CRON_SECRET=...
```

- Gemini 모델은 `gemini-2.5-flash` 사용 (1.5/2.0은 죽음 — 메모리 `blocker_gemini_billing` 참고).
- 더미 `.env.local` 만들지 말 것 (메모리 `feedback_no_dummy_envlocal`).

## 4. 첫 admin 지정

새 DB에는 admin이 없다. Google로 한 번 로그인해 `public.users` 행을 만든 뒤, SQL Editor에서:

```sql
update public.users set is_admin = true where id = '<내-user-id>';
```

이후 `/admin`에서 챌린지·퀴즈 관리 가능.

## 5. 실행 / 배포

```
npm install
npm run dev      # 로컬
npm run build    # 배포 빌드
```

cron(챌린지 마감·정산)은 `CRON_SECRET`으로 보호된 `/api/cron/*` 라우트를 외부 스케줄러(예: Vercel Cron)로 호출한다.

---

## 콘텐츠를 다시 백업하고 싶을 때

```
node scripts/backup-content.mjs   # PII 없는 콘텐츠 → db-backup/content-seed + restore-content.sql 재생성
node scripts/backup-db.mjs        # 전체 덤프(유저 포함) → db-backup/<timestamp>/  (PII 주의)
```
