import { createServiceClient } from '@/lib/supabase/server'
import { Card } from '@/ds/card'
import { Badge } from '@/ds/badge'
import SeedToggle from './SeedToggle'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const supabase = await createServiceClient()

  const { data: users } = await supabase
    .from('users')
    .select('id, nickname, coin_balance, is_admin, is_seed, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-bold text-text-primary">유저 관리</h1>
        <p className="text-xs text-text-muted">시드 계정만 시드 제출 페이지에 표시됩니다</p>
      </div>

      <Card className="overflow-hidden">
        {!users || users.length === 0 ? (
          <div className="p-12 text-center text-text-muted">유저가 없어요</div>
        ) : (
          <div>
            <div
              className="grid gap-3 px-4 py-2.5 bg-bg-base border-b border-border text-xs font-semibold text-text-muted"
              style={{ gridTemplateColumns: '1fr 100px 70px 70px 100px' }}
            >
              <span>닉네임</span>
              <span>코인</span>
              <span>역할</span>
              <span>시드</span>
              <span>가입일</span>
            </div>

            {users.map((user, idx) => (
              <div
                key={user.id}
                className={['grid gap-3 px-4 py-3 items-center', idx < users.length - 1 ? 'border-b border-border' : ''].join(' ')}
                style={{ gridTemplateColumns: '1fr 100px 70px 70px 100px' }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-full bg-accent-light text-accent flex items-center justify-center text-xs font-bold shrink-0"
                    aria-hidden="true"
                  >
                    {user.nickname[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-text-primary truncate">{user.nickname}</span>
                </div>
                <span className="text-[13px] font-semibold text-accent tabular-nums">
                  {user.coin_balance.toLocaleString()}
                </span>
                <span>
                  <Badge variant={user.is_admin ? 'accent' : 'muted'} className="text-[11px]">
                    {user.is_admin ? '관리자' : '일반'}
                  </Badge>
                </span>
                <span>
                  {user.is_admin
                    ? <span className="text-xs text-text-faint">—</span>
                    : <SeedToggle userId={user.id} isSeed={user.is_seed ?? false} />
                  }
                </span>
                <span className="text-xs text-text-muted">
                  {new Date(user.created_at).toLocaleDateString('ko-KR')}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
