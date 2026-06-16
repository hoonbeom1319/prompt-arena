import { cn } from '@/lib/utils'
import { getMedalColor } from '@/lib/rank-colors'
import { IconTrophy } from '@/ds/icons'

interface PodiumEntry {
  id: string
  rank: number
  votes: number
  label: string
  attemptNumber: number
}

interface PodiumProps {
  entries: PodiumEntry[]
}

const BLOCK_HEIGHTS: Record<number, number> = { 1: 76, 2: 54, 3: 42 }

export default function Podium({ entries }: PodiumProps) {
  const byRank = Object.fromEntries(entries.map(e => [e.rank, e]))
  const podiumOrder = [byRank[2], byRank[1], byRank[3]].filter(Boolean) as PodiumEntry[]

  if (podiumOrder.length === 0) return null

  const tiedVoteCounts = new Set(
    entries
      .map(e => e.votes)
      .filter((v, _, arr) => arr.filter(x => x === v).length > 1)
  )

  return (
    <div className="flex items-end justify-center gap-2.5">
      {podiumOrder.map(entry => {
        const isFirst = entry.rank === 1
        const showAttempt = tiedVoteCounts.has(entry.votes)
        const medal = getMedalColor(entry.rank)
        return (
          <div key={entry.id} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
            {isFirst && <IconTrophy width={18} height={18} className="text-accent" />}
            <div
              className={cn(
                'rounded-full flex items-center justify-center font-bold border border-border',
                isFirst ? 'w-[52px] h-[52px] text-base' : 'w-11 h-11 text-sm',
              )}
              style={medal ? { background: medal.bg, color: medal.text } : undefined}
            >
              #{entry.label}
            </div>
            <div className="text-center leading-tight">
              <div className="text-[11px] text-text-muted tabular-nums">{entry.votes}표</div>
              {showAttempt && (
                <div className="text-[10px] text-text-faint tabular-nums">{entry.attemptNumber}회 시도</div>
              )}
            </div>
            <div
              className="w-full rounded-t-md flex items-start justify-center pt-2 text-[22px] font-extrabold"
              style={{
                height: BLOCK_HEIGHTS[entry.rank] ?? 42,
                background: medal?.bg ?? 'var(--color-bg-subtle)',
                color: medal?.text ?? 'var(--color-text-muted)',
              }}
            >
              {entry.rank}
            </div>
          </div>
        )
      })}
    </div>
  )
}
