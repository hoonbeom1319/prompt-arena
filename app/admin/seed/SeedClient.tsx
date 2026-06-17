'use client'

import { useEffect, useState } from 'react'
import { getChallengeState, type Challenge as ChallengeRecord } from '@/lib/challenge/challenge-state'
import { MIN_PARTICIPANTS } from '@/lib/constants'
import { Button } from '@/ds/button'
import { Textarea } from '@/ds/input'
import { Card } from '@/ds/card'
import { Badge } from '@/ds/badge'
import { IconZap } from '@/ds/icons'
import StatsRow from '@/components/StatsRow'

type ChallengeOption = Pick<ChallengeRecord, 'id' | 'title' | 'instruction' | 'submission_start_at' | 'submission_end_at' | 'voting_start_at' | 'voting_end_at'>

interface SeedRow {
  id: string
  submitted_at: string
  result_text: string
  nickname: string
}

interface EligibleUser {
  id: string
  nickname: string
  hasSubmission: boolean
}

interface SeedClientProps {
  initialChallenges: ChallengeOption[]
}

// 시드 조회·추가만 담당하는 클라이언트 island. 활성 챌린지 목록은 서버에서 props로 받는다.
// 시드 데이터·추가는 /api/admin/seed 경유 — supabase 직접 호출 없음 (ARCHITECTURE §2).
export default function SeedClient({ initialChallenges }: SeedClientProps) {
  const challenges = initialChallenges
  const [selectedId, setSelectedId] = useState<string>(() => {
    const now = new Date()
    const inSubmission = initialChallenges.find(c => getChallengeState(c as ChallengeRecord, now) === 'submission')
    return inSubmission?.id ?? initialChallenges[0]?.id ?? ''
  })
  const [userCount, setUserCount] = useState(0)
  const [seedCount, setSeedCount] = useState(0)
  const [seeds, setSeeds] = useState<SeedRow[]>([])
  const [eligibleUsers, setEligibleUsers] = useState<EligibleUser[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [promptText, setPromptText] = useState('')
  const [lastResult, setLastResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const selected = challenges.find(c => c.id === selectedId) ?? null
  const selectedState = selected ? getChallengeState(selected as ChallengeRecord) : null
  const availableUsers = eligibleUsers.filter(u => !u.hasSubmission)

  const loadChallengeData = async (challengeId: string) => {
    const res = await fetch(`/api/admin/seed?challengeId=${encodeURIComponent(challengeId)}`)
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || '시드 목록을 불러오지 못했어요.')
      return
    }

    setSeedCount(data.seedCount ?? 0)
    setUserCount(data.userCount ?? 0)
    setSeeds(data.seeds ?? [])

    const users: EligibleUser[] = data.eligibleUsers ?? []
    setEligibleUsers(users)

    const nextAvailable = users.find(u => !u.hasSubmission)
    setSelectedUserId(prev => {
      if (prev && users.some(u => u.id === prev && !u.hasSubmission)) return prev
      return nextAvailable?.id ?? ''
    })
  }

  useEffect(() => {
    async function init() {
      if (selectedId) await loadChallengeData(selectedId)
      setPageLoading(false)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChallengeChange = async (challengeId: string) => {
    setSelectedId(challengeId)
    setLastResult(null)
    setError(null)
    setSuccess(null)
    await loadChallengeData(challengeId)
  }

  const handleSubmitSeed = async () => {
    if (!selectedId || !promptText.trim() || !selectedUserId) return
    if (selectedState !== 'submission') {
      setError('제출 기간인 챌린지에서만 시드를 추가할 수 있어요.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    const res = await fetch('/api/admin/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challengeId: selectedId,
        userId: selectedUserId,
        promptText: promptText.trim(),
      }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || '시드 추가에 실패했어요.')
    } else {
      setLastResult(data.generation?.result_text ?? null)
      setSuccess(`${data.nickname ?? '시드'} 출품작이 추가됐어요.`)
      setPromptText('')
      await loadChallengeData(selectedId)
    }

    setLoading(false)
  }

  if (pageLoading) {
    return (
      <div className="flex justify-center py-16" role="status" aria-label="불러오는 중">
        <div className="w-8 h-8 border-[3px] border-border border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-[22px] font-bold text-text-primary mb-1">시드 제출 (콜드 스타트)</h1>
      <p className="text-sm text-text-secondary mb-5">
        PRD A-4 — 운영자가 챌린지에 시드 출품작을 직접 추가해 빈집을 방어합니다.{' '}
        <code className="text-xs bg-bg-subtle px-1 py-0.5 rounded">submissions.is_seed = true</code>
      </p>

      <Card className="p-3 mb-5 bg-bg-subtle border-dashed">
        <p className="text-xs text-text-muted">
          I3 미해결: 시드를 예시로 표시할지 / 자연스럽게 섞을지 — 현재는 관리 화면에서만 「시드」뱃지로 구분합니다.
        </p>
      </Card>

      {challenges.length === 0 ? (
        <Card className="p-12 text-center text-text-muted">
          활성 챌린지가 없어요. 먼저 챌린지를 출제해 주세요.
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-5 items-start">
          <div className="flex flex-col gap-4">
            <Card className="p-4">
              <label htmlFor="challenge-select" className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                대상 챌린지
              </label>
              <select
                id="challenge-select"
                value={selectedId}
                onChange={e => { void handleChallengeChange(e.target.value) }}
                className="w-full mt-2 px-3 py-2 text-sm rounded-md border border-border bg-bg-card text-text-primary outline-none focus:border-accent"
              >
                {challenges.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>

              {selected && (
                <>
                  <p className="text-sm text-text-secondary mt-3 leading-relaxed">{selected.instruction}</p>
                  <div className="mt-3">
                    <Badge variant={selectedState === 'submission' ? 'accent' : 'muted'} className="text-[11px]">
                      {selectedState === 'submission' ? '제출 기간 — 시드 추가 가능' : '제출 기간 아님'}
                    </Badge>
                  </div>
                  <div className="mt-4">
                    <StatsRow stats={[
                      { value: String(userCount), label: '사용자 제출' },
                      { value: String(seedCount), label: '시드' },
                      { value: `${MIN_PARTICIPANTS}↑`, label: '성립 기준' },
                    ]} />
                  </div>
                </>
              )}
            </Card>

            <Card className="p-4 flex flex-col gap-3">
              <div>
                <label htmlFor="seed-user" className="text-sm font-semibold text-text-primary">
                  시드 제출자
                </label>
                {availableUsers.length === 0 ? (
                  <p className="mt-2 text-sm text-text-muted">
                    이 챌린지에 아직 제출하지 않은 사용자가 없어요. 테스트 계정을 추가하거나 다른 챌린지를 선택해 주세요.
                  </p>
                ) : (
                  <>
                    <select
                      id="seed-user"
                      value={selectedUserId}
                      onChange={e => setSelectedUserId(e.target.value)}
                      disabled={loading || selectedState !== 'submission'}
                      className="w-full mt-2 px-3 py-2 text-sm rounded-md border border-border bg-bg-card text-text-primary outline-none focus:border-accent"
                    >
                      {availableUsers.map(user => (
                        <option key={user.id} value={user.id}>{user.nickname}</option>
                      ))}
                    </select>
                    <p className="mt-1.5 text-xs text-text-muted">
                      기존 User를 선택해 시드로 제출합니다. 챌린지당 1인 1제출이라 이미 제출한 사용자는 목록에서 빠집니다.
                    </p>
                  </>
                )}
              </div>

              <div>
                <label htmlFor="seed-prompt" className="text-sm font-semibold text-text-primary">
                  프롬프트 본문
                </label>
                <Textarea
                  id="seed-prompt"
                  value={promptText}
                  onChange={e => setPromptText(e.target.value)}
                  placeholder="시드용 프롬프트를 입력하세요…"
                  rows={5}
                  disabled={loading || selectedState !== 'submission'}
                  className="mt-2"
                />
              </div>

              {success && (
                <p role="status" className="text-sm text-accent">{success}</p>
              )}

              {error && (
                <p role="alert" className="text-sm text-error">{error}</p>
              )}

              <Button
                variant="primary"
                onClick={handleSubmitSeed}
                disabled={
                  loading
                  || !promptText.trim()
                  || !selectedUserId
                  || availableUsers.length === 0
                  || selectedState !== 'submission'
                }
              >
                {loading ? (
                  'Gemini 실행 중…'
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <IconZap width={16} height={16} />시드 출품작 추가
                  </span>
                )}
              </Button>

              <p className="text-xs text-text-muted">
                API가 Gemini 실행과 시드 제출을 한 번에 처리합니다. 선택한 사용자로{' '}
                <code className="text-[11px]">generations</code> +{' '}
                <code className="text-[11px]">submissions(is_seed=true)</code>가 생성됩니다.
              </p>

              {lastResult && (
                <div>
                  <div className="text-[11px] font-semibold text-accent uppercase tracking-wider mb-2">
                    ✦ 최근 추가된 결과물
                  </div>
                  <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap bg-bg-subtle border border-border rounded-md p-3">
                    {lastResult}
                  </p>
                </div>
              )}
            </Card>
          </div>

          <Card className="p-4">
            <h2 className="text-[15px] font-semibold text-text-primary mb-3">등록된 시드</h2>
            {seeds.length === 0 ? (
              <p className="text-sm text-text-muted py-8 text-center">
                이 챌린지에 등록된 시드가 없어요.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-text-muted border-b border-border">
                      <th className="pb-2 font-semibold">작성자</th>
                      <th className="pb-2 font-semibold">결과물</th>
                      <th className="pb-2 font-semibold text-right">일시</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seeds.map(seed => (
                      <tr key={seed.id} className="border-b border-border last:border-0">
                        <td className="py-2.5 pr-2 text-text-primary whitespace-nowrap">
                          {seed.nickname}
                          <Badge variant="muted" className="ml-1.5 text-[10px]">시드</Badge>
                        </td>
                        <td className="py-2.5 pr-2 text-xs text-text-secondary max-w-[200px] truncate">
                          {seed.result_text}
                        </td>
                        <td className="py-2.5 text-right text-xs text-text-muted whitespace-nowrap tabular-nums">
                          {new Date(seed.submitted_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
