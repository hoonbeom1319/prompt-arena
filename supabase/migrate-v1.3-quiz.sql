-- PRD v1.3 데일리 O/X 퀴즈 — 기존 운영 DB에 증분 적용용.
-- ⚠️ schema.sql 전체를 재실행하지 말 것 (기존 create policy에서 "already exists" 에러 → 전체 롤백).
-- 이 파일만 Supabase SQL editor에 붙여넣어 실행. 재실행해도 안전(drop policy if exists 포함).

-- 1) 신규 테이블 ---------------------------------------------------------------
create table if not exists public.quiz_items (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  correct_answer text not null check (correct_answer in ('O', 'X')),
  explanation text not null,
  publish_date date not null unique,
  created_at timestamptz default now() not null
);

create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  quiz_item_id uuid references public.quiz_items(id) on delete cascade not null,
  choice text not null check (choice in ('O', 'X')),
  is_correct boolean not null,
  answered_at timestamptz default now() not null,
  unique(user_id, quiz_item_id)
);

create table if not exists public.streaks (
  user_id uuid references public.users(id) on delete cascade primary key,
  current_streak integer default 0 not null,
  best_streak integer default 0 not null,
  last_correct_date date,
  updated_at timestamptz default now() not null
);

-- 2) RLS (enable은 idempotent, policy는 drop 후 재생성으로 재실행 안전) ----------
alter table public.quiz_items enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.streaks enable row level security;

-- quiz_items: 정답·해설 포함 → public read 정책 없음 (서버 service-role만 접근)

drop policy if exists "quiz_answers_own" on public.quiz_answers;
create policy "quiz_answers_own" on public.quiz_answers for select using (auth.uid() = user_id);

drop policy if exists "streaks_own" on public.streaks;
create policy "streaks_own" on public.streaks for select using (auth.uid() = user_id);

-- (연승 마일스톤 뱃지는 제외 — 연승 숫자 자체가 보상. 이미 streak_* 뱃지를 넣었다면 아래로 제거 가능)
-- delete from public.badges where condition_type in ('streak_10','streak_20','streak_30');
