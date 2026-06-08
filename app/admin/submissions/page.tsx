import { createClient } from '@/lib/supabase/server'
import { Card } from '@/ds/card'
import { Badge } from '@/ds/badge'

export const dynamic = 'force-dynamic'

export default async function AdminSubmissionsPage() {
  const supabase = await createClient()

  const { data: submissions } = await supabase
    .from('submissions')
    .select(`
      id, submitted_at, is_seed, final_rank, final_vote_count,
      user_id, challenge_id, challenges(title), users(nickname)
    `)
    .order('submitted_at', { ascending: false })
    .limit(50)

  return (
    <div>
      <h1 className="text-[22px] font-bold text-text-primary mb-6">제출 현황</h1>

      <Card className="overflow-hidden">
        {!submissions || submissions.length === 0 ? (
          <div className="p-12 text-center text-text-muted">아직 제출이 없어요</div>
        ) : (
          <div>
            {/* Header */}
            <div
              className="grid gap-3 px-4 py-2.5 bg-bg-base border-b border-border text-xs font-semibold text-text-muted"
              style={{ gridTemplateColumns: '1fr 1fr 100px 80px 80px' }}
              role="row"
              aria-label="테이블 헤더"
            >
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
                  className={['grid gap-3 px-4 py-3 items-center', idx < submissions.length - 1 ? 'border-b border-border' : ''].join(' ')}
                  style={{ gridTemplateColumns: '1fr 1fr 100px 80px 80px' }}
                >
                  <span className="text-[13px] font-medium text-text-primary flex items-center gap-1.5">
                    {(challenge as { title: string } | null)?.title ?? '-'}
                    {sub.is_seed && <Badge variant="muted" className="text-[10px]">시드</Badge>}
                  </span>
                  <span className="text-[13px] text-text-secondary">
                    {(user as { nickname: string } | null)?.nickname ?? '알 수 없음'}
                  </span>
                  <span className="text-xs text-text-muted">
                    {new Date(sub.submitted_at).toLocaleDateString('ko-KR')}
                  </span>
                  <span className={['text-[13px] font-semibold', sub.final_rank && sub.final_rank <= 3 ? 'text-warning' : 'text-text-secondary'].join(' ')}>
                    {sub.final_rank ? `${sub.final_rank}위` : '-'}
                  </span>
                  <span className="text-[13px] text-text-secondary">{sub.final_vote_count ?? 0}</span>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
