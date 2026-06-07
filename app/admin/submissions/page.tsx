import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AdminSubmissionsPage() {
  const supabase = await createClient()

  const { data: submissions } = await supabase
    .from('submissions')
    .select(`
      id,
      submitted_at,
      is_seed,
      final_rank,
      final_vote_count,
      user_id,
      challenge_id,
      challenges(title),
      users(nickname)
    `)
    .order('submitted_at', { ascending: false })
    .limit(50)

  return (
    <div>
      <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '24px' }}>
        제출 현황
      </h1>

      <div className="card" style={{ overflow: 'hidden' }}>
        {!submissions || submissions.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            아직 제출이 없어요
          </div>
        ) : (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 100px 80px 80px',
              gap: '12px',
              padding: '10px 16px',
              backgroundColor: 'var(--bg-base)',
              borderBottom: '1px solid var(--border)',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--text-muted)',
            }}>
              <span>챌린지</span>
              <span>유저</span>
              <span>제출일</span>
              <span>순위</span>
              <span>투표수</span>
            </div>

            {submissions.map((sub, idx) => {
              const challenge = Array.isArray(sub.challenges) ? sub.challenges[0] : sub.challenges
              const user = Array.isArray(sub.users) ? sub.users[0] : sub.users
              return (
                <div
                  key={sub.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 100px 80px 80px',
                    gap: '12px',
                    padding: '12px 16px',
                    alignItems: 'center',
                    borderBottom: idx < submissions.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>
                    {(challenge as { title: string } | null)?.title ?? '-'}
                    {sub.is_seed && (
                      <span className="badge badge-muted" style={{ fontSize: '10px', marginLeft: '6px' }}>시드</span>
                    )}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {(user as { nickname: string } | null)?.nickname ?? '알 수 없음'}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {new Date(sub.submitted_at).toLocaleDateString('ko-KR')}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: sub.final_rank && sub.final_rank <= 3 ? 'var(--warning)' : 'var(--text-secondary)' }}>
                    {sub.final_rank ? `${sub.final_rank}위` : '-'}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {sub.final_vote_count ?? 0}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
