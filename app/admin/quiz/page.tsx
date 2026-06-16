'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/ds/button'
import { Input, Textarea } from '@/ds/input'
import { Label } from '@/ds/label'
import { Card } from '@/ds/card'

interface QuizItem {
  id: string
  question: string
  correct_answer: 'O' | 'X'
  explanation: string
  publish_date: string
}

const pad = (n: number) => String(n).padStart(2, '0')
const todayLocal = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const SAMPLE = `[
  { "question": "프롬프트에 역할(페르소나)을 부여하면 답변 품질이 달라질 수 있다.", "correct_answer": "O", "explanation": "역할 지정은 모델의 톤·관점을 유도해 결과에 영향을 줍니다." },
  { "question": "프롬프트는 무조건 길수록 좋다.", "correct_answer": "X", "explanation": "길이가 아니라 명확성·구체성이 핵심입니다. 불필요하게 길면 오히려 산만해집니다." }
]`

export default function AdminQuizPage() {
  const [stock, setStock] = useState<number | null>(null)
  const [items, setItems] = useState<QuizItem[]>([])
  const [startDate, setStartDate] = useState(todayLocal())
  const [raw, setRaw] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // 이벤트 핸들러(등록 후)에서 재조회 — effect 밖이라 setState 직접 호출 OK.
  const load = async () => {
    const res = await fetch('/api/admin/quiz')
    if (res.ok) {
      const data = await res.json()
      setStock(data.stock)
      setItems(data.items)
    }
  }

  // 최초 1회 조회 — setState는 비동기 .then 콜백 안에서만 (set-state-in-effect 회피).
  useEffect(() => {
    let active = true
    fetch('/api/admin/quiz')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (active && data) {
          setStock(data.stock)
          setItems(data.items)
        }
      })
    return () => {
      active = false
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      setError('JSON 형식이 올바르지 않아요. 대괄호로 감싼 배열인지 확인해주세요.')
      return
    }
    if (!Array.isArray(parsed) || parsed.length === 0) {
      setError('문항 배열이 비어 있어요.')
      return
    }

    // answer / correct_answer 양쪽 허용 → 정규화
    const normalized = (parsed as Record<string, unknown>[]).map(it => ({
      question: String(it.question ?? ''),
      correct_answer: String(it.correct_answer ?? it.answer ?? '').toUpperCase(),
      explanation: String(it.explanation ?? ''),
    }))

    setLoading(true)
    const res = await fetch('/api/admin/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start_date: startDate, items: normalized }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? '등록에 실패했어요.')
    } else {
      setSuccess(`${data.count}개 문항을 등록했어요. (${data.from} ~ ${data.to})`)
      setRaw('')
      load()
    }
    setLoading(false)
  }

  return (
    <div>
      <h1 className="text-[22px] font-bold text-text-primary mb-1">데일리 퀴즈 관리</h1>
      <p className="text-sm text-text-secondary mb-5">
        외부 AI(Claude·Gemini·ChatGPT 등)로 만든 O/X 문항 묶음을 붙여넣어 배치 등록해요. 정답·해설 검수는 운영자 몫이에요 — 정답이 틀리면 신뢰가 깨져요.
      </p>

      <Card className="p-5 mb-5">
        <div className="flex items-baseline gap-2">
          <span className="text-sm text-text-secondary">비축 잔량 (오늘 이후)</span>
          <span className="text-2xl font-bold text-accent">
            {stock === null ? '…' : `${stock}일치`}
          </span>
        </div>
        {stock !== null && stock <= 3 && (
          <p className="text-[13px] text-warning mt-1.5">⚠️ 비축이 거의 떨어졌어요. 문항을 더 등록해주세요.</p>
        )}
      </Card>

      <form onSubmit={handleSubmit}>
        <Card className="p-6 mb-5">
          <h2 className="text-base font-bold mb-4">문항 배치 등록</h2>
          <div className="max-w-[240px] mb-4">
            <Label htmlFor="start_date">시작 게시일 *</Label>
            <Input
              id="start_date"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              required
            />
            <p className="text-[11px] text-text-muted mt-1">이미 문항이 있는 날짜는 자동으로 건너뛰어요.</p>
          </div>

          <div>
            <Label htmlFor="raw">문항 JSON *</Label>
            <Textarea
              id="raw"
              value={raw}
              onChange={e => setRaw(e.target.value)}
              placeholder={SAMPLE}
              rows={12}
              className="font-mono text-[12.5px]"
              required
            />
            <p className="text-[11px] text-text-muted mt-1">
              형식: {`{ "question", "correct_answer": "O"|"X", "explanation" }`} 의 배열. correct_answer 대신 answer도 인식해요.
            </p>
          </div>

          {error && (
            <div role="alert" className="px-4 py-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-error text-sm mt-4">
              {error}
            </div>
          )}
          {success && (
            <div role="status" className="px-4 py-3 bg-[color-mix(in_oklab,var(--success)_12%,white)] border border-[color-mix(in_oklab,var(--success)_32%,white)] rounded-lg text-sm mt-4">
              {success}
            </div>
          )}

          <div className="flex justify-end mt-5">
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? '등록 중...' : '배치 등록'}
            </Button>
          </div>
        </Card>
      </form>

      <Card className="p-6">
        <h2 className="text-base font-bold mb-4">예정 문항 ({items.length})</h2>
        {items.length === 0 ? (
          <p className="text-sm text-text-muted">예정된 문항이 없어요.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {items.map(it => (
              <li key={it.id} className="py-3 flex items-start gap-3">
                <span className="shrink-0 text-xs font-mono text-text-muted w-[88px] pt-0.5">{it.publish_date}</span>
                <span className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-bg-subtle text-[13px] font-bold">
                  {it.correct_answer}
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-text-primary leading-snug">{it.question}</p>
                  <p className="text-[12.5px] text-text-muted leading-snug mt-0.5">{it.explanation}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
