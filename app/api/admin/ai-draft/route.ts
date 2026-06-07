import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateChallengeDraft } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check - admin only
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

    const { topic } = await request.json()

    if (!topic?.trim()) {
      return NextResponse.json({ error: '주제를 입력해주세요.' }, { status: 400 })
    }

    const draft = await generateChallengeDraft(topic.trim())

    return NextResponse.json(draft)
  } catch (err) {
    console.error('AI draft error:', err)
    return NextResponse.json({ error: 'AI 생성에 실패했어요.' }, { status: 500 })
  }
}
