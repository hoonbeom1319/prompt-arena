import { Card } from '@/ds/card'
import { Badge } from '@/ds/badge'

interface TopicCardProps {
  category?: string | null
  title: string
  instruction?: string
  compact?: boolean
}

export default function TopicCard({ category, title, instruction, compact }: TopicCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        {category && <Badge variant="accent">{category}</Badge>}
        <span className="text-xs text-text-faint whitespace-nowrap">이번 챌린지</span>
      </div>
      <h2 className={[
        'font-extrabold text-text-primary leading-tight tracking-tight',
        compact ? 'text-[17px]' : 'text-[19px]',
      ].join(' ')}>
        &ldquo;{title}&rdquo;
      </h2>
      {instruction && (
        <p className="text-sm text-text-secondary leading-relaxed mt-2">{instruction}</p>
      )}
    </Card>
  )
}
