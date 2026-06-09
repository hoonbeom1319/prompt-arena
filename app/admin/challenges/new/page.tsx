'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/ds/button'
import { Input, Textarea } from '@/ds/input'
import { Label } from '@/ds/label'
import { Card } from '@/ds/card'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const formatDay = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAYS[d.getDay()]})`
const addDays = (date: string, n: number) => {
  const d = new Date(`${date}T00:00:00`)
  d.setDate(d.getDate() + n)
  return d
}

export default function NewChallengePage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    instruction: '',
    model_name: 'gemini-2.5-flash',
    temperature: '0.7',
    wrapper_text: '',
    submission_date: '',
  })
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiTopic, setAiTopic] = useState('')

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
      body: JSON.stringify({ ...form, temperature: parseFloat(form.temperature) }),
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
      <h1 className="text-[22px] font-bold text-text-primary mb-6">새 챌린지 만들기</h1>

      {/* AI Draft */}
      <Card className="p-5 mb-6 bg-accent-light border-accent/30">
        <h2 className="text-sm font-bold text-accent mb-3">AI로 챌린지 초안 생성</h2>
        <div className="flex gap-2">
          <Input
            type="text"
            value={aiTopic}
            onChange={e => setAiTopic(e.target.value)}
            placeholder="주제를 입력하세요 (예: 여행 계획짜기, 시 쓰기)"
            aria-label="AI 챌린지 초안 주제"
          />
          <Button
            type="button"
            variant="accent"
            onClick={handleAiDraft}
            disabled={aiLoading || !aiTopic.trim()}
            className="shrink-0"
          >
            {aiLoading ? '생성 중...' : 'AI 생성'}
          </Button>
        </div>
      </Card>

      <form onSubmit={handleSubmit}>
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
            제출일만 고르면 투표·결과 공개일은 자동으로 정해져요. (제출 → 다음 날 투표 → 그 다음 날 결과)
          </p>
          <div className="max-w-[240px]">
            <Label htmlFor="submission_date">제출일 *</Label>
            <Input
              id="submission_date"
              type="date"
              value={form.submission_date}
              onChange={e => update('submission_date', e.target.value)}
              required
            />
          </div>

          {form.submission_date && (
            <div className="mt-4 flex flex-wrap gap-2 text-[13px]" aria-live="polite">
              {[
                { label: '제출', day: formatDay(addDays(form.submission_date, 0)), color: 'text-success' },
                { label: '투표', day: formatDay(addDays(form.submission_date, 1)), color: 'text-warning' },
                { label: '결과', day: formatDay(addDays(form.submission_date, 2)), color: 'text-accent' },
              ].map(item => (
                <div
                  key={item.label}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-base border border-border rounded-full"
                >
                  <span className={`font-semibold ${item.color}`}>{item.label}</span>
                  <span className="text-text-secondary">{item.day}</span>
                </div>
              ))}
            </div>
          )}
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
          <Button type="submit" variant="accent" disabled={loading}>
            {loading ? '생성 중...' : '챌린지 만들기'}
          </Button>
        </div>
      </form>
    </div>
  )
}
