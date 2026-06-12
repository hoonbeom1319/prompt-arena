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
  ('프롬프트 장인', '챌린지를 10번 참여했어요', '⚒️', 'participation_10')
on conflict do nothing;
