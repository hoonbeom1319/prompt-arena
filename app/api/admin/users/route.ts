import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { error: NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 }) }

  const { data: profile } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return { error: NextResponse.json({ error: '관리자만 접근할 수 있어요.' }, { status: 403 }) }

  return { user }
}

// PATCH /api/admin/users — is_seed 토글
export async function PATCH(request: NextRequest) {
  const auth = await assertAdmin()
  if ('error' in auth) return auth.error

  const { userId, isSeed } = await request.json()
  if (!userId || typeof isSeed !== 'boolean') {
    return NextResponse.json({ error: 'userId와 isSeed가 필요해요.' }, { status: 400 })
  }

  const serviceSupabase = await createServiceClient()

  const { data: target } = await serviceSupabase
    .from('users')
    .select('is_admin')
    .eq('id', userId)
    .single()

  if (target?.is_admin) {
    return NextResponse.json({ error: '관리자 계정은 시드로 지정할 수 없어요.' }, { status: 400 })
  }

  const { error } = await serviceSupabase
    .from('users')
    .update({ is_seed: isSeed })
    .eq('id', userId)

  if (error) {
    return NextResponse.json({ error: '업데이트에 실패했어요.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
