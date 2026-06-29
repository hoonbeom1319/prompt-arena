// 콘텐츠 전용 백업 — PII(유저 관련) 전부 제외.
// 남기는 것: categories, challenges, badges, quiz_items (admin/콘텐츠/설정).
// 산출물: ① db-backup/content-seed/*.json  ② supabase/restore-content.sql (재시드용, PII 없음 → 커밋 가능)
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    })
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const fetchAll = async (table) => {
  const { data, error } = await supabase.from(table).select('*')
  if (error) throw new Error(`${table}: ${error.message}`)
  return data
}

// SQL 리터럴 이스케이프
const lit = (v) => {
  if (v === null || v === undefined) return 'null'
  if (typeof v === 'number') return String(v)
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  return `'${String(v).replace(/'/g, "''")}'`
}

const [categories, challenges, badges, quizItems] = await Promise.all([
  fetchAll('categories'),
  fetchAll('challenges'),
  fetchAll('badges'),
  fetchAll('quiz_items'),
])

// ---- JSON 백업 ----
const outDir = join('db-backup', 'content-seed')
mkdirSync(outDir, { recursive: true })
const dump = { categories, challenges, badges, quiz_items: quizItems }
for (const [name, rows] of Object.entries(dump)) {
  writeFileSync(join(outDir, `${name}.json`), JSON.stringify(rows, null, 2))
}

// ---- 재시드 SQL ----
// schema.sql이 카테고리/뱃지를 name으로 이미 시드하므로 challenge.category_id는 UUID가 아닌
// "이름 조회 서브쿼리"로 연결 → 새 DB의 카테고리 UUID와 무관하게 안전.
const catNameById = Object.fromEntries(categories.map((c) => [c.id, c.name]))

const lines = []
lines.push('-- 콘텐츠 재시드 — schema.sql 실행 후 이어서 실행.')
lines.push('-- PII 없음(챌린지·30일 퀴즈만). 카테고리/뱃지는 schema.sql이 이미 시드함.')
lines.push('-- 재실행 안전: challenges.id PK / quiz_items.publish_date UNIQUE 충돌 시 skip.')
lines.push('')

lines.push('-- challenges --------------------------------------------------------')
for (const c of challenges) {
  const catName = catNameById[c.category_id]
  const catExpr = catName
    ? `(select id from public.categories where name = ${lit(catName)} limit 1)`
    : 'null'
  lines.push(
    `insert into public.challenges (id, title, instruction, category_id, challenge_type, submission_start_at, submission_end_at, voting_start_at, voting_end_at, model_name, temperature, wrapper_text, created_by, is_active, created_at) values (` +
      [
        lit(c.id),
        lit(c.title),
        lit(c.instruction),
        catExpr,
        lit(c.challenge_type),
        lit(c.submission_start_at),
        lit(c.submission_end_at),
        lit(c.voting_start_at),
        lit(c.voting_end_at),
        lit(c.model_name),
        lit(c.temperature),
        lit(c.wrapper_text),
        lit(c.created_by),
        lit(c.is_active),
        lit(c.created_at),
      ].join(', ') +
      `) on conflict (id) do nothing;`
  )
}
lines.push('')

lines.push('-- quiz_items (30일 퀴즈) --------------------------------------------')
for (const q of quizItems) {
  lines.push(
    `insert into public.quiz_items (id, question, correct_answer, explanation, publish_date, created_at) values (` +
      [
        lit(q.id),
        lit(q.question),
        lit(q.correct_answer),
        lit(q.explanation),
        lit(q.publish_date),
        lit(q.created_at),
      ].join(', ') +
      `) on conflict (publish_date) do nothing;`
  )
}
lines.push('')

mkdirSync('supabase', { recursive: true })
writeFileSync(join('supabase', 'restore-content.sql'), lines.join('\n'))

console.log('콘텐츠 백업 완료')
console.log(`  JSON  → ${outDir}/  (categories ${categories.length}, challenges ${challenges.length}, badges ${badges.length}, quiz_items ${quizItems.length})`)
console.log(`  SQL   → supabase/restore-content.sql  (challenges ${challenges.length} + quiz_items ${quizItems.length} INSERT)`)
