-- PRD v1.4 연승 회복(코인 첫 사용처) — 기존 운영 DB에 증분 적용용.
-- ⚠️ schema.sql 전체를 재실행하지 말 것. 이 파일만 Supabase SQL editor에 붙여넣어 실행.
-- 재실행해도 안전(add column if not exists).

-- streaks에 회복 추적 컬럼 2개 추가 ------------------------------------------------
--  recoverable_streak: 틀려서 끊긴 직전 연승값(>0). null = 회복 대상 없음.
--  recoverable_date  : 틀린 게시일. 오늘 문항 게시일과 같을 때만 회복 허용(소급 불가).
alter table public.streaks add column if not exists recoverable_streak integer;
alter table public.streaks add column if not exists recoverable_date date;

-- 코인 사용(차감)은 기존 coin_transactions 원장에 음수 amount로 기록된다(스키마 변경 없음).
-- 잔액 음수 방지는 회복 API의 사전 잔액 체크로 보장.
