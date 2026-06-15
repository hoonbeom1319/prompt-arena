'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/ds/button'
import { Input, Textarea } from '@/ds/input'
import { Label } from '@/ds/label'
import { Card } from '@/ds/card'
import { createClient } from '@/lib/supabase/client'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const formatDay = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAYS[d.getDay()]})`
const addDays = (date: string, n: number) => {
  const d = new Date(`${date}T00:00:00`)
  d.setDate(d.getDate() + n)
  return d
}
// ISO(UTC) → KST 달력 날짜 YYYY-MM-DD (제출 시작 시각의 KST 날짜).
// 저장이 KST 자정 기준(deriveTwoDayISO)이라, 표시도 브라우저 타임존이 아닌
// KST로 못박아야 제출일이 그대로 왕복된다. sv-SE 로케일은 'YYYY-MM-DD HH:mm:ss' 포맷.
const isoToKstDate = (iso: string) =>
  new Date(iso).toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).slice(0, 10)

export default function EditChallengePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [form, setForm] = useState({
    title: '',
    instruction: '',
    model_name: 'gemini-2.5-flash',
    temperature: '0.7',
    wrapper_text: '',
    submission_date: '',
  })
  const [pageLoading, setPageLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('challenges')
      .select('title, instruction, model_name, temperature, wrapper_text, submission_start_at')
      .eq('id', id)
      .single()
      .then(({ data, error: loadError }) => {
        if (loadError || !data) {
          setError('챌린지를 불러오지 못했어요.')
          setPageLoading(false)
          return
        }
        setForm({
          title: data.title ?? '',
          instruction: data.instruction ?? '',
          model_name: data.model_name ?? 'gemini-2.5-flash',
          temperature: String(data.temperature ?? 0.7),
          wrapper_text: data.wrapper_text ?? '',
          submission_date: isoToKstDate(data.submission_start_at),
        })
        setPageLoading(false)
      })
  }, [id])

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch(`/api/admin/challenges/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, temperature: parseFloat(form.temperature) }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || '챌린지 수정에 실패했어요.')
    } else {
      router.push('/admin/challenges')
    }
    setLoading(false)
  }

  if (pageLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]" role="status" aria-label="불러오는 중">
        <div className="w-8 h-8 border-[3px] border-border border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-[22px] font-bold text-text-primary mb-5">챌린지 수정</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-2xl">
        <Card className="p-6">
          <h2 className="text-base font-bold mb-5">기본 정보</h2>
          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="title">챌린지 제목 *</Label>
              <Input
                id="title"
                type="text"
                value={form.title}
                onChange={e => update('title', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="instruction">챌린지 설명 *</Label>
              <Textarea
                id="instruction"
                value={form.instruction}
                onChange={e => update('instruction', e.target.value)}
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
                rows={3}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
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

        <Card className="p-6">
          <h2 className="text-base font-bold mb-1">일정 설정</h2>
          <p className="text-xs text-text-muted mb-5">
            제출일만 바꾸면 나머지(제출 마감·투표 시작/마감)는 자동으로 다시 정해져요. 투표 마감(자정) 직후 결과가 자동 공개됩니다. (2일 주기)
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
                { label: '결과', day: `${formatDay(addDays(form.submission_date, 1))} 자정 직후`, color: 'text-accent' },
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
          <div role="alert" className="px-4 py-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-error text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-2.5 justify-end">
          <Button type="button" variant="secondary" onClick={() => router.push('/admin/challenges')}>
            취소
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? '저장 중...' : '변경 저장'}
          </Button>
        </div>
      </form>
    </div>
  )
}
