-- Run in Supabase SQL editor

-- Users profile (extends auth.users)
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  nickname text not null,
  coin_balance integer default 0 not null,
  is_admin boolean default false not null,
  created_at timestamptz default now() not null
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  display_order integer default 0 not null
);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  instruction text not null,
  category_id uuid references public.categories(id),
  challenge_type text default 'standalone' not null,
  submission_start_at timestamptz not null,
  submission_end_at timestamptz not null,
  voting_start_at timestamptz not null,
  voting_end_at timestamptz not null,
  model_name text default 'gemini-1.5-flash' not null,
  temperature numeric default 0.7 not null,
  wrapper_text text,
  created_by text default 'admin' not null,
  is_active boolean default true not null,
  created_at timestamptz default now() not null
);

create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  challenge_id uuid references public.challenges(id) on delete cascade not null,
  prompt_text text not null,
  result_text text not null,
  attempt_number integer not null,
  created_at timestamptz default now() not null,
  unique(user_id, challenge_id, attempt_number)
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  challenge_id uuid references public.challenges(id) on delete cascade not null,
  generation_id uuid references public.generations(id) not null,
  submitted_at timestamptz default now() not null,
  -- AI 중립 요약 (PRD v1.1 4.6.4) — 제출 시 1회 생성. 실패 시 null 허용(우아한 실패)
  ai_summary text,
  final_vote_count integer,
  final_rank integer,
  is_seed boolean default false not null,
  unique(user_id, challenge_id)
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  challenge_id uuid references public.challenges(id) on delete cascade not null,
  submission_id uuid references public.submissions(id) on delete cascade not null,
  voted_at timestamptz default now() not null,
  unique(user_id, submission_id)
);

create table if not exists public.coin_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  amount integer not null,
  reason text not null,
  challenge_id uuid references public.challenges(id),
  created_at timestamptz default now() not null
);

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  icon text not null,
  condition_type text not null
);

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  badge_id uuid references public.badges(id) not null,
  earned_at timestamptz default now() not null,
  unique(user_id, badge_id)
);

-- 데일리 O/X 퀴즈 (PRD v1.3 4.7) — "빈 시간 채우는 작은 양념"
-- 출제: 외부 AI 작성 → admin 배치 등록. 하루 1문항.
create table if not exists public.quiz_items (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  -- 정답은 'O' 또는 'X'. 응답 전 클라이언트에 노출 금지(아래 RLS 참고)
  correct_answer text not null check (correct_answer in ('O', 'X')),
  explanation text not null,
  -- 게시 일자 (하루 1문항 보장). 서버 시각 자정 기준.
  publish_date date not null unique,
  created_at timestamptz default now() not null
);

-- 일별 사용자 응답 기록 = 데일리 리텐션 축 (PRD 4.7.5)
create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  quiz_item_id uuid references public.quiz_items(id) on delete cascade not null,
  choice text not null check (choice in ('O', 'X')),
  is_correct boolean not null,
  answered_at timestamptz default now() not null,
  -- 한 User는 한 문항(하루)에 1회만
  unique(user_id, quiz_item_id)
);

-- 연승 캐시 (QuizAnswer에서 파생 가능하나 현재값 캐시 — PRD 6.1)
create table if not exists public.streaks (
  user_id uuid references public.users(id) on delete cascade primary key,
  current_streak integer default 0 not null,
  best_streak integer default 0 not null,
  -- 마지막으로 정답을 맞힌 '게시 일자'. 직전 출제일과 비교해 연속 여부 판정.
  last_correct_date date,
  updated_at timestamptz default now() not null
);

-- RLS Policies
alter table public.users enable row level security;
alter table public.categories enable row level security;
alter table public.challenges enable row level security;
alter table public.generations enable row level security;
alter table public.submissions enable row level security;
alter table public.votes enable row level security;
alter table public.coin_transactions enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.quiz_items enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.streaks enable row level security;

-- Users: own row
create policy "users_select_own" on public.users for select using (auth.uid() = id);
create policy "users_insert_own" on public.users for insert with check (auth.uid() = id);
create policy "users_update_own" on public.users for update using (auth.uid() = id);

-- Categories: public read
create policy "categories_public_read" on public.categories for select using (true);

-- Challenges: public read
create policy "challenges_public_read" on public.challenges for select using (true);

-- Generations: only owner
create policy "generations_owner" on public.generations for select using (auth.uid() = user_id);
create policy "generations_insert" on public.generations for insert with check (auth.uid() = user_id);

-- Submissions: complex rules handled in API routes with service key
-- For now, allow authenticated read of result_text/id during voting
create policy "submissions_public_read" on public.submissions for select using (true);
create policy "submissions_insert" on public.submissions for insert with check (auth.uid() = user_id);

-- Votes: own votes
create policy "votes_own" on public.votes for select using (auth.uid() = user_id);
create policy "votes_insert" on public.votes for insert with check (auth.uid() = user_id);

-- Coin transactions: own
create policy "coins_own" on public.coin_transactions for select using (auth.uid() = user_id);

-- Badges: public
create policy "badges_public" on public.badges for select using (true);
create policy "user_badges_own" on public.user_badges for select using (auth.uid() = user_id);

-- Quiz items: 정답·해설이 들어있어 public read 금지.
-- 오늘 문항 노출/채점은 모두 서버(service role)에서 처리. 일반 사용자 직접 접근 차단.
-- (별도 select policy 없음 = RLS로 anon/authenticated 직접 read 불가)

-- Quiz answers / streaks: 본인 것만 read (집계·갱신은 서버 service role)
create policy "quiz_answers_own" on public.quiz_answers for select using (auth.uid() = user_id);
create policy "streaks_own" on public.streaks for select using (auth.uid() = user_id);

-- Default categories
insert into public.categories (name, display_order) values
  ('글쓰기', 1),
  ('코딩', 2),
  ('요약', 3),
  ('번역', 4),
  ('분석', 5),
  ('창작', 6),
  ('기타', 99)
on conflict do nothing;

-- Default badges
insert into public.badges (name, description, icon, condition_type) values
  ('첫 제출', '처음으로 프롬프트를 제출했어요', '🚀', 'first_submission'),
  ('첫 우승', '처음으로 챌린지에서 우승했어요', '🏆', 'first_win'),
  ('3연속 우승', '챌린지에서 3번 우승했어요', '👑', 'wins_3'),
  ('투표왕', '투표를 30번 했어요', '🗳️', 'votes_30'),
  ('프롬프트 장인', '챌린지를 10번 참여했어요', '⚒️', 'participation_10'),
  ('10연승', '퀴즈를 10일 연속 맞혔어요', '🔥', 'streak_10'),
  ('20연승', '퀴즈를 20일 연속 맞혔어요', '⚡', 'streak_20'),
  ('30연승', '퀴즈를 30일 연속 맞혔어요', '💎', 'streak_30')
on conflict do nothing;
