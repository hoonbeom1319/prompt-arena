import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: '관리자만 접근할 수 있어요.' }, { status: 403 })
    }

    const s = await createServiceClient()

    // 외래키 의존 순서대로 삭제
    await s.from('votes').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await s.from('user_badges').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await s.from('coin_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await s.from('submissions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await s.from('generations').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await s.from('challenges').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await s.from('users').update({ coin_balance: 0 }).neq('id', '00000000-0000-0000-0000-000000000000')

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Reset error:', err)
    return NextResponse.json({ error: '초기화 중 오류가 발생했어요.' }, { status: 500 })
  }
}
