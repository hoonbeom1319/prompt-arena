import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { recoverStreak } from '@/lib/quiz'

// 연승 회복 실행 (PRD v1.4 4.7.6) — 코인 첫 사용처.
// "틀린 직후 그 자리"에서만 호출되는 별도 액션. 소급 차단·잔액 검증은 recoverStreak가 서버 시각·서버 데이터로 판정.
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 })
    }

    const service = await createServiceClient()
    const result = await recoverStreak(service, user.id)

    if (!result.ok) {
      // 회복 불가(회복 대상 없음/소급/코인 부족) — 상태는 그대로, 안내만.
      return NextResponse.json(
        { error: result.error, streak: result.streak, balance: result.balance },
        { status: 409 }
      )
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('Quiz recover error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했어요.' }, { status: 500 })
  }
}
