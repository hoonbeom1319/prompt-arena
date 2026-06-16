'use client'

import { useEffect, useState } from 'react'
import { MAX_VOTES } from '@/lib/constants'

export interface Submission {
  id: string
  result_text: string
  prompt_text?: string | null
  ai_summary?: string | null
}

const mapSubmission = (s: Submission): Submission => ({
  id: s.id,
  result_text: s.result_text,
  prompt_text: s.prompt_text ?? null,
  ai_summary: s.ai_summary ?? null,
})

// 투표 상태 머신 + /api/vote 호출을 캡슐화. 목록은 3표 완료 후 갱신되는
// 인터랙션 데이터라 /api 경유 (ARCHITECTURE §2.2·§4). 인증·챌린지는 서버 컴포넌트가 보장.
export const useVoting = (challengeId: string) => {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [votedIds, setVotedIds] = useState<string[]>([])
  const [voting, setVoting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const res = await fetch(`/api/vote?challengeId=${challengeId}`)
      const data = await res.json()
      if (cancelled) return

      if (res.ok) {
        setSubmissions(data.submissions.map(mapSubmission))
        setVotedIds(data.votedSubmissionIds)
        if (data.revealed) setRevealed(true)
      } else {
        setError(data.error || '목록을 불러오지 못했어요.')
      }

      setPageLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [challengeId])

  const votesUsed = votedIds.length
  const promptsUnlocked = revealed || votesUsed >= MAX_VOTES
  const hasVoted = (submissionId: string) => votedIds.includes(submissionId)

  const vote = async (submissionId: string) => {
    if (votedIds.includes(submissionId)) return
    if (votedIds.length >= MAX_VOTES) return

    setVoting(true)
    setError(null)

    const res = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId, submissionId }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || '투표에 실패했어요.')
    } else {
      const newVotes = [...votedIds, submissionId]
      setVotedIds(newVotes)
      // 3표를 모두 쓰면 프롬프트가 해제되므로 목록을 다시 읽어 prompt_text를 채운다.
      if (newVotes.length >= MAX_VOTES) {
        setRevealed(true)
        const revealRes = await fetch(`/api/vote?challengeId=${challengeId}`)
        const revealData = await revealRes.json()
        if (revealRes.ok && revealData.revealed) {
          setSubmissions(revealData.submissions.map(mapSubmission))
        }
      }
    }

    setVoting(false)
  }

  return {
    submissions,
    voting,
    error,
    pageLoading,
    revealed,
    votesUsed,
    promptsUnlocked,
    hasVoted,
    vote,
  }
}
