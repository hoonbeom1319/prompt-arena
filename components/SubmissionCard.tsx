interface SubmissionCardProps {
  attemptNumber: number
  promptText: string
  resultText: string
  onSelect?: () => void
  isSelected?: boolean
  isSubmitted?: boolean
}

export default function SubmissionCard({
  attemptNumber,
  promptText,
  resultText,
  onSelect,
  isSelected,
  isSubmitted,
}: SubmissionCardProps) {
  return (
    <div style={{
      border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      backgroundColor: 'var(--bg-card)',
      boxShadow: isSelected ? '0 0 0 3px rgba(217, 119, 87, 0.15)' : 'var(--shadow-sm)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--bg-base)',
      }}>
        <span style={{
          fontSize: '13px',
          fontWeight: '600',
          color: 'var(--text-secondary)',
        }}>
          시도 #{attemptNumber}
        </span>
        {isSubmitted && (
          <span className="badge badge-success" style={{ fontSize: '11px' }}>
            제출됨
          </span>
        )}
        {isSelected && !isSubmitted && (
          <span className="badge badge-accent" style={{ fontSize: '11px' }}>
            선택됨
          </span>
        )}
      </div>

      {/* Prompt */}
      <div style={{ padding: '16px' }}>
        <div style={{
          fontSize: '12px',
          fontWeight: '600',
          color: 'var(--text-muted)',
          marginBottom: '6px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          내 프롬프트
        </div>
        <p style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          lineHeight: '1.6',
          marginBottom: '16px',
          padding: '10px',
          backgroundColor: 'var(--bg-base)',
          borderRadius: '6px',
          fontFamily: 'monospace',
        }}>
          {promptText}
        </p>

        <div style={{
          fontSize: '12px',
          fontWeight: '600',
          color: 'var(--text-muted)',
          marginBottom: '6px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          AI 응답
        </div>
        <p style={{
          fontSize: '14px',
          color: 'var(--text-primary)',
          lineHeight: '1.7',
          whiteSpace: 'pre-wrap',
        }}>
          {resultText}
        </p>

        {onSelect && !isSubmitted && (
          <div style={{ marginTop: '16px' }}>
            <button
              onClick={onSelect}
              className={isSelected ? 'btn-secondary' : 'btn-accent'}
              style={{ fontSize: '14px', width: '100%', justifyContent: 'center' }}
            >
              {isSelected ? '다른 것 선택하기' : '이 결과로 제출하기'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
