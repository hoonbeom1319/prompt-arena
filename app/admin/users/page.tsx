import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from('users')
    .select('id, nickname, coin_balance, is_admin, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div>
      <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '24px' }}>
        유저 관리
      </h1>

      <div className="card" style={{ overflow: 'hidden' }}>
        {!users || users.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            유저가 없어요
          </div>
        ) : (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 100px 80px 100px',
              gap: '12px',
              padding: '10px 16px',
              backgroundColor: 'var(--bg-base)',
              borderBottom: '1px solid var(--border)',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--text-muted)',
            }}>
              <span>닉네임</span>
              <span>코인</span>
              <span>역할</span>
              <span>가입일</span>
            </div>

            {users.map((user, idx) => (
              <div
                key={user.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 100px 80px 100px',
                  gap: '12px',
                  padding: '12px 16px',
                  alignItems: 'center',
                  borderBottom: idx < users.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent-light)',
                    color: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '700',
                    flexShrink: 0,
                  }}>
                    {user.nickname[0]?.toUpperCase()}
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                    {user.nickname}
                  </span>
                </div>
                <span style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: '600' }}>
                  {user.coin_balance.toLocaleString()} 🪙
                </span>
                <span style={{ fontSize: '12px' }}>
                  {user.is_admin ? (
                    <span className="badge badge-accent" style={{ fontSize: '11px' }}>관리자</span>
                  ) : (
                    <span className="badge badge-muted" style={{ fontSize: '11px' }}>일반</span>
                  )}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {new Date(user.created_at).toLocaleDateString('ko-KR')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
