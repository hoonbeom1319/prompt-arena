interface VoteCardProps {
  submissionId: string
  rank?: number
  resultText: string
  promptText?: string | null
  voteCount?: number
  hasVoted: boolean
  isRevealed: boolean
  onVote: (submissionId: string) => void
  voting?: boolean
}

export default function VoteCard({
  submissionId,
  rank,
  resultText,
  promptText,
  voteCount,
  hasVoted,
  isRevealed,
  onVote,
  voting = false,
}: VoteCardProps) {
  const rankLabels: Record<number, string> = {
    1: '🥇',
    2: '🥈',
    3: '🥉',
  }

  return (
    <div style={{
      border: hasVoted ? '2px solid var(--accent)' : '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      backgroundColor: 'var(--bg-card)',
      boxShadow: hasVoted ? '0 0 0 3px var(--accent-light)' : 'var(--shadow-sm)',
    }}>
      {/* Header */}
      {rank !== undefined && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          backgroundColor: rank <= 3 ? 'var(--accent-light)' : 'var(--bg-base)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {rank <= 3 && <span style={{ fontSize: '20px' }}>{rankLabels[rank]}</span>}
            <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
              {rank}위
            </span>
          </div>
          {voteCount !== undefined && (
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {voteCount}표
            </span>
          )}
        </div>
      )}

      <div style={{ padding: '16px' }}>
        {/* Result text (always shown during voting, blind) */}
        <div style={{
          fontSize: '12px',
          fontWeight: '600',
          color: 'var(--text-muted)',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          AI 응답
        </div>
        <p style={{
          fontSize: '15px',
          color: 'var(--text-primary)',
          lineHeight: '1.7',
          marginBottom: '16px',
          whiteSpace: 'pre-wrap',
        }}>
          {resultText}
        </p>

        {/* Prompt text — shown only when revealed */}
        {isRevealed && promptText && (
          <>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--text-muted)',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              사용된 프롬프트
            </div>
            <p style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: '1.6',
              padding: '10px 12px',
              backgroundColor: 'var(--bg-base)',
              borderRadius: '6px',
              fontFamily: 'monospace',
              marginBottom: '16px',
            }}>
              {promptText}
            </p>
          </>
        )}

        {/* Vote button */}
        {!isRevealed && (
          <button
            onClick={() => onVote(submissionId)}
            disabled={voting}
            style={{
              width: '100%',
              padding: '10px',
              border: hasVoted ? '2px solid var(--accent)' : '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: hasVoted ? 'var(--accent-light)' : 'transparent',
              color: hasVoted ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: '14px',
              fontWeight: '600',
              cursor: voting ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            {hasVoted ? '투표 완료 ✓' : '이 답변에 투표'}
          </button>
        )}
      </div>
    </div>
  )
}
