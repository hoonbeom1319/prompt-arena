import { createServiceClient } from '@/lib/supabase/server'
import EditChallengeForm from './EditChallengeForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

// ISO(UTC) → KST 달력 날짜 YYYY-MM-DD. 저장이 KST 자정 기준(deriveTwoDayISO)이라
// 표시도 KST로 못박아야 제출일이 그대로 왕복된다. sv-SE 로케일은 'YYYY-MM-DD HH:mm:ss' 포맷.
const isoToKstDate = (iso: string) =>
  new Date(iso).toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).slice(0, 10)

// 기존 챌린지 값은 서버에서 읽어 폼 초기값으로 내린다. 수정은 폼이 PATCH /api/admin/challenges/[id]로 처리
// (admin 인증은 app/admin/layout.tsx가 보장 — ARCHITECTURE §2).
export default async function EditChallengePage({ params }: PageProps) {
  const { id } = await params

  const service = await createServiceClient()
  const { data } = await service
    .from('challenges')
    .select('title, instruction, model_name, temperature, wrapper_text, submission_start_at')
    .eq('id', id)
    .single()

  if (!data) {
    return (
      <div>
        <h1 className="text-[22px] font-bold text-text-primary mb-5">챌린지 수정</h1>
        <p role="alert" className="text-sm text-error">챌린지를 불러오지 못했어요.</p>
      </div>
    )
  }

  const initialForm = {
    title: data.title ?? '',
    instruction: data.instruction ?? '',
    model_name: data.model_name ?? 'gemini-2.5-flash',
    temperature: String(data.temperature ?? 0.7),
    wrapper_text: data.wrapper_text ?? '',
    submission_date: isoToKstDate(data.submission_start_at),
  }

  return <EditChallengeForm challengeId={id} initialForm={initialForm} />
}
