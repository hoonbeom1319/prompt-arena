'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type State = { error?: string; success?: boolean } | null

export async function updateNickname(_prevState: State, formData: FormData): Promise<State> {
  const nickname = (formData.get('nickname') as string)?.trim()

  if (!nickname) return { error: '닉네임을 입력해주세요' }
  if (nickname.length > 20) return { error: '닉네임은 20자 이하로 입력해주세요' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다' }

  const { error } = await supabase
    .from('users')
    .update({ nickname })
    .eq('id', user.id)

  if (error) return { error: '저장에 실패했습니다' }

  revalidatePath('/profile')
  return { success: true }
}
