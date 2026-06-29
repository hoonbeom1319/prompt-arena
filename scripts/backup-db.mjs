// DB 전량 백업 — service_role 키로 RLS 우회, 모든 public 테이블 + auth 유저를 JSON으로 덤프.
// 실행: node scripts/backup-db.mjs   (.env 로드)
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

// .env 직접 파싱 (dotenv 의존 없이)
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

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SECRET_KEY
if (!url || !key) throw new Error('SUPABASE URL/SECRET_KEY 없음')

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const TABLES = [
  'users',
  'categories',
  'challenges',
  'generations',
  'submissions',
  'votes',
  'coin_transactions',
  'badges',
  'user_badges',
  'quiz_items',
  'quiz_answers',
  'streaks',
]

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const outDir = join('db-backup', stamp)
mkdirSync(outDir, { recursive: true })

const summary = {}

// PostgREST 기본 1000행 제한 → range로 페이지네이션
const dumpTable = async (table) => {
  const all = []
  const pageSize = 1000
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .range(from, from + pageSize - 1)
    if (error) throw new Error(`${table}: ${error.message}`)
    all.push(...data)
    if (data.length < pageSize) break
  }
  writeFileSync(join(outDir, `${table}.json`), JSON.stringify(all, null, 2))
  summary[table] = all.length
  console.log(`  ${table}: ${all.length} rows`)
}

// auth.users (실제 로그인 계정·이메일) — admin API
const dumpAuthUsers = async () => {
  const all = []
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error(`auth.users: ${error.message}`)
    all.push(...data.users)
    if (data.users.length < 1000) break
  }
  writeFileSync(join(outDir, `auth_users.json`), JSON.stringify(all, null, 2))
  summary['auth_users'] = all.length
  console.log(`  auth_users: ${all.length} rows`)
}

console.log(`백업 시작 → ${outDir}`)
for (const t of TABLES) await dumpTable(t)
await dumpAuthUsers()

writeFileSync(
  join(outDir, '_summary.json'),
  JSON.stringify({ backedUpAt: new Date().toISOString(), counts: summary }, null, 2)
)
console.log('\n완료. 요약:', summary)
