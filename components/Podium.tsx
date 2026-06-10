interface PodiumEntry {
  id: string
  rank: number
  votes: number
  label: string
}

interface PodiumProps {
  entries: PodiumEntry[]
}

const BLOCK_HEIGHTS: Record<number, number> = { 1: 76, 2: 54, 3: 42 }

export default function Podium({ entries }: PodiumProps) {
  const byRank = Object.fromEntries(entries.map(e => [e.rank, e]))
  const podiumOrder = [byRank[2], byRank[1], byRank[3]].filter(Boolean) as PodiumEntry[]

  if (podiumOrder.length === 0) return null

  return (
    <div className="flex items-end justify-center gap-2.5">
      {podiumOrder.map(entry => {
        const isFirst = entry.rank === 1
        return (
          <div key={entry.id} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
            {isFirst && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-accent" aria-hidden="true">
                <path d="M8 21h8M12 17v4M7 4h10l1 7H6l1-7zM9 4V3h6v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            <div className={[
              'rounded-full flex items-center justify-center font-bold border',
              isFirst
                ? 'w-[52px] h-[52px] text-base bg-accent-light text-accent border-accent-mid'
                : 'w-11 h-11 text-sm bg-bg-base text-text-secondary border-border',
            ].join(' ')}>
              #{entry.label}
            </div>
            <div className="text-xs font-bold text-text-primary truncate max-w-full text-center">
              익명#{entry.label}
            </div>
            <div className="text-[11px] text-text-muted tabular-nums">{entry.votes}표</div>
            <div
              className={[
                'w-full rounded-t-md flex items-start justify-center pt-2 text-[22px] font-extrabold',
                isFirst ? 'bg-accent text-white' : 'bg-bg-base text-text-faint border border-border border-b-0',
              ].join(' ')}
              style={{ height: BLOCK_HEIGHTS[entry.rank] ?? 42 }}
            >
              {entry.rank}
            </div>
          </div>
        )
      })}
    </div>
  )
}
