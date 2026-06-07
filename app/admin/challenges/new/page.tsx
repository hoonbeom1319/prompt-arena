'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewChallengePage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    instruction: '',
    model_name: 'gemini-1.5-flash',
    temperature: '0.7',
    wrapper_text: '',
    submission_start_at: '',
    submission_end_at: '',
    voting_start_at: '',
    voting_end_at: '',
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
      body: JSON.stringify({
        ...form,
        temperature: parseFloat(form.temperature),
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
      <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '24px' }}>
        새 챌린지 만들기
      </h1>

      {/* AI Draft */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px', backgroundColor: 'var(--accent-light)', border: '1px solid rgba(217,119,87,0.3)' }}>
        <h2 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent)', marginBottom: '12px' }}>
          AI로 챌린지 초안 생성
        </h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={aiTopic}
            onChange={e => setAiTopic(e.target.value)}
            placeholder="주제를 입력하세요 (예: 여행 계획짜기, 시 쓰기)"
            className="input"
          />
          <button
            onClick={handleAiDraft}
            disabled={aiLoading || !aiTopic.trim()}
            className="btn-accent"
            style={{ flexShrink: 0 }}
          >
            {aiLoading ? '생성 중...' : 'AI 생성'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>기본 정보</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                챌린지 제목 *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={e => update('title', e.target.value)}
                className="input"
                placeholder="20자 이내로 입력해주세요"
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                챌린지 설명 *
              </label>
              <textarea
                value={form.instruction}
                onChange={e => update('instruction', e.target.value)}
                className="input"
                placeholder="참가자들에게 어떤 프롬프트를 작성해야 하는지 설명해주세요"
                rows={4}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                래퍼 텍스트 (선택) — {'{{prompt}}'} 위치에 참가자 프롬프트가 삽입됩니다
              </label>
              <textarea
                value={form.wrapper_text}
                onChange={e => update('wrapper_text', e.target.value)}
                className="input"
                placeholder="예: 다음 조건을 지키세요:\n{{prompt}}\n\n위 내용에 따라 결과를 만들어주세요."
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>AI 모델 설정</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                모델
              </label>
              <select
                value={form.model_name}
                onChange={e => update('model_name', e.target.value)}
                className="input"
                style={{ cursor: 'pointer' }}
              >
                <option value="gemini-1.5-flash">gemini-1.5-flash (빠름)</option>
                <option value="gemini-1.5-pro">gemini-1.5-pro (정확)</option>
                <option value="gemini-2.0-flash">gemini-2.0-flash (최신)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Temperature: {form.temperature}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={form.temperature}
                onChange={e => update('temperature', e.target.value)}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>정확 (0)</span>
                <span>창의 (1)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>일정 설정</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { key: 'submission_start_at', label: '제출 시작' },
              { key: 'submission_end_at', label: '제출 마감' },
              { key: 'voting_start_at', label: '투표 시작' },
              { key: 'voting_end_at', label: '투표 마감' },
            ].map(field => (
              <div key={field.key}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {field.label} *
                </label>
                <input
                  type="datetime-local"
                  value={form[field.key as keyof typeof form]}
                  onChange={e => update(field.key, e.target.value)}
                  className="input"
                  required
                />
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--error)',
            fontSize: '14px',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => router.push('/admin/challenges')}
            className="btn-secondary"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-accent"
          >
            {loading ? '생성 중...' : '챌린지 만들기'}
          </button>
        </div>
      </form>
    </div>
  )
}
