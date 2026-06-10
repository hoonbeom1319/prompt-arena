import { Badge } from '@/ds/badge'
import { Button } from '@/ds/button'
import { Card } from '@/ds/card'
import { cn } from '@/lib/utils'

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
    <Card
      className={cn(
        'overflow-hidden',
        isSelected && 'border-accent shadow-[0_0_0_3px_var(--accent-light)]',
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-subtle">
        <span className="text-[13px] font-semibold text-text-secondary">
          시도 #{attemptNumber}
        </span>
        {isSubmitted && <Badge variant="success" className="text-[11px]">제출됨</Badge>}
        {isSelected && !isSubmitted && <Badge variant="accent" className="text-[11px]">선택됨</Badge>}
      </div>

      <div className="p-4">
        <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
          내 프롬프트
        </div>
        <p className="text-sm text-text-secondary leading-relaxed mb-4 p-2.5 bg-bg-subtle rounded-md font-mono">
          {promptText}
        </p>

        <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
          AI 응답
        </div>
        <p className="text-sm text-text-primary leading-[1.7] whitespace-pre-wrap">
          {resultText}
        </p>

        {onSelect && !isSubmitted && (
          <div className="mt-4">
            <Button
              variant={isSelected ? 'secondary' : 'primary'}
              className="w-full"
              onClick={onSelect}
            >
              {isSelected ? '다른 것 선택하기' : '이 결과로 제출하기'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
