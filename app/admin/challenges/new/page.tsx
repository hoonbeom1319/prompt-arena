'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/ds/button'
import { Input, Textarea } from '@/ds/input'
import { Label } from '@/ds/label'
import { Card } from '@/ds/card'
import { createClient } from '@/lib/supabase/client'
import { getChallengeState } from '@/lib/challenge-state'
import ScheduleFields from '../ScheduleFields'
import { deriveTwoDayLocal, localToISO, type ScheduleLocal } from '@/lib/challenge-schedule'

const EMPTY_SCHEDULE: ScheduleLocal = {
  submission_start: '', submission_end: '', voting_start: '', voting_end: '',
}

export default function NewChallengePage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    instruction: '',
    model_name: 'gemini-2.5-flash',
    temperature: '0.7',
    wrapper_text: '',
  })
  const [dateQuick, setDateQuick] = useState('')
  const [schedule, setSchedule] = useState<ScheduleLocal>(EMPTY_SCHEDULE)
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiTopic, setAiTopic] = useState('')
  const [activeConflict, setActiveConflict] = useState<{ title: string; state: 'submission' | 'voting' } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('challenges')
      .select('id, title, instruction, submission_start_at, submission_end_at, voting_start_at, voting_end_at, category_id, challenge_type, model_name, temperature, wrapper_text, created_by, is_active, created_at')
      .eq('is_active', true)
      .then(({ data }) => {
        if (!data) return
        const now = new Date()
        const conflict = data.find(c => {
          const s = getChallengeState(c, now)
          return s === 'submission' || s === 'voting'
        })
        if (conflict) {
          const s = getChallengeState(conflict, now)
          if (s === 'submission' || s === 'voting') {
            setActiveConflict({ title: conflict.title, state: s })
          }
        }
      })
  }, [])

  const handleAiDraft = async () => {
    if (!aiTopic.trim()) return
    setAiLoading(true)
    const res = await fetch('/api/admin/ai-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: aiTopic }),
    })
    const data = await res.json()
    if (res.ok) {
      setForm(prev => ({ ...prev, title: data.title, instruction: data.instruction }))
    } else {
      setError(data.error || 'AI 생성에 실패했어요.')
    }
    setAiLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/admin/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        instruction: form.instruction,
        model_name: form.model_name,
        temperature: parseFloat(form.temperature),
        wrapper_text: form.wrapper_text,
        ...localToISO(schedule),
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || '챌린지 생성에 실패했어요.')
    } else {
      router.push('/admin/challenges')
    }
    setLoading(false)
  }

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }))

  return (
    <div>
      <h1 className="text-[22px] font-bold text-text-primary mb-5">챌린지 출제</h1>

      {activeConflict && (
        <div role="alert" className="px-4 py-3.5 bg-[color-mix(in_oklab,var(--warning)_12%,white)] border border-[color-mix(in_oklab,var(--warning)_32%,white)] rounded-lg mb-5">
          <p className="text-sm font-semibold text-text-primary mb-0.5">
            진행 중인 챌린지가 있어요
          </p>
          <p className="text-sm text-text-secondary">
            &lsquo;{activeConflict.title}&rsquo;이 현재{' '}
            <strong>{activeConflict.state === 'submission' ? '제출' : '투표'} 중</strong>입니다.
            지금 새 챌린지를 만들면 홈 화면이 새 챌린지로 덮어씌워져요.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-5 items-start">
        {/* AI 초안 채팅 (좌) */}
        <Card className="p-4">
          <div className="flex items-center gap-2 text-text-primary font-semibold text-[15px] mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-accent" aria-hidden="true">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            AI 주제 초안 (챗봇)
          </div>
          <div className="flex flex-col gap-2.5 mb-4">
            <div className="self-start max-w-[90%] p-3 bg-bg-subtle border border-border rounded-lg rounded-tl-sm text-xs text-text-secondary">
              어떤 카테고리의 주제를 만들까요? 채점 가능한 형태로 제안드릴게요.
            </div>
            {aiTopic && (
              <div className="self-end max-w-[85%] p-3 bg-accent-light border border-accent-mid rounded-lg rounded-tr-sm text-xs text-text-primary">
                {aiTopic}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              type="text"
              value={aiTopic}
              onChange={e => setAiTopic(e.target.value)}
              placeholder="예: 글쓰기 카테고리, 채점 가능한 주제 3개"
              aria-label="AI 챌린지 초안 주제"
            />
            <Button
              type="button"
              variant="primary"
              onClick={handleAiDraft}
              disabled={aiLoading || !aiTopic.trim()}
              className="shrink-0"
            >
              {aiLoading ? '생성 중...' : '초안 생성'}
            </Button>
          </div>
        </Card>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Card className="p-6 mb-4">
          <h2 className="text-base font-bold mb-5">기본 정보</h2>
          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="title">챌린지 제목 *</Label>
              <Input
                id="title"
                type="text"
                value={form.title}
                onChange={e => update('title', e.target.value)}
                placeholder="20자 이내로 입력해주세요"
                required
              />
            </div>
            <div>
              <Label htmlFor="instruction">챌린지 설명 *</Label>
              <Textarea
                id="instruction"
                value={form.instruction}
                onChange={e => update('instruction', e.target.value)}
                placeholder="참가자들에게 어떤 프롬프트를 작성해야 하는지 설명해주세요"
                rows={4}
                required
              />
            </div>
            <div>
              <Label htmlFor="wrapper_text">
                래퍼 텍스트 (선택) — {'{{prompt}}'} 위치에 참가자 프롬프트가 삽입됩니다
              </Label>
              <Textarea
                id="wrapper_text"
                value={form.wrapper_text}
                onChange={e => update('wrapper_text', e.target.value)}
                placeholder="예: 다음 조건을 지키세요:\n{{prompt}}\n\n위 내용에 따라 결과를 만들어주세요."
                rows={3}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 mb-4">
          <h2 className="text-base font-bold mb-5">AI 모델 설정</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="model_name">모델</Label>
              <select
                id="model_name"
                value={form.model_name}
                onChange={e => update('model_name', e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-border bg-bg-card text-text-primary outline-none focus:border-accent cursor-pointer"
              >
                <option value="gemini-2.5-flash">gemini-2.5-flash (빠름)</option>
                <option value="gemini-2.5-pro">gemini-2.5-pro (정확)</option>
                <option value="gemini-3.5-flash">gemini-3.5-flash (최신)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="temperature">Temperature: {form.temperature}</Label>
              <input
                id="temperature"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={form.temperature}
                onChange={e => update('temperature', e.target.value)}
                className="w-full accent-accent mt-1"
                aria-valuemin={0}
                aria-valuemax={1}
                aria-valuenow={parseFloat(form.temperature)}
              />
              <div className="flex justify-between text-[11px] text-text-muted mt-1">
                <span>정확 (0)</span>
                <span>창의 (1)</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="text-base font-bold mb-1">일정 설정</h2>
          <p className="text-xs text-text-muted mb-5">
            제출일을 고르면 2일 주기로 자동 채워져요. 필요하면 아래 시각을 직접 조정하세요. 투표 마감(자정) 직후 결과가 자동 공개됩니다.
          </p>
          <div className="max-w-[240px] mb-5">
            <Label htmlFor="date_quick">제출일 (빠른 채우기)</Label>
            <Input
              id="date_quick"
              type="date"
              value={dateQuick}
              onChange={e => {
                setDateQuick(e.target.value)
                if (e.target.value) setSchedule(deriveTwoDayLocal(e.target.value))
              }}
            />
          </div>

          <ScheduleFields value={schedule} onChange={setSchedule} />
        </Card>

        {error && (
          <div role="alert" className="px-4 py-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-error text-sm mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-2.5 justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/admin/challenges')}
          >
            취소
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? '생성 중...' : '챌린지 확정'}
          </Button>
        </div>
      </form>
      </div>
    </div>
  )
}
