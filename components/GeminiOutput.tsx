import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { cn } from '@/lib/utils'

// Gemini 결과물(result_text) 렌더러 — generate·vote·results 4개 지점이 공유한다.
// result_text에 마크다운(**강조**, 리스트 등)이 섞여 나와 raw 텍스트로 노출되던 걸 렌더링한다.
// 사용자/AI 콘텐츠라 raw HTML은 허용하지 않는다(react-markdown 기본값이 안전).
// prose 플러그인 대신 디자인 토큰 유틸로 매핑한다(ARCHITECTURE §5 토큰 단일화).
// remark-breaks로 단일 줄바꿈을 살려 기존 whitespace-pre-wrap 동작과 맞춘다.

const components: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  del: ({ children }) => <del className="text-text-muted">{children}</del>,
  ul: ({ children }) => <ul className="list-disc pl-5 mb-2 last:mb-0 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 last:mb-0 space-y-1">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent underline">
      {children}
    </a>
  ),
  h1: ({ children }) => <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
  h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-bold mb-1.5 mt-3 first:mt-0">{children}</h3>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-border pl-3 text-text-secondary my-2">{children}</blockquote>
  ),
  // 코드블록(pre>code)은 language- 클래스가 붙는다 → pre가 박스를 그리니 코드는 최소 스타일.
  // 인라인 코드는 알약(pill) 스타일.
  code: ({ className, children }) =>
    /language-/.test(className ?? '') ? (
      <code className="font-mono text-[13px]">{children}</code>
    ) : (
      <code className="px-1 py-0.5 rounded bg-bg-card border border-border text-[13px] font-mono">
        {children}
      </code>
    ),
  pre: ({ children }) => (
    <pre className="bg-bg-card border border-border rounded-md p-2.5 overflow-x-auto my-2">{children}</pre>
  ),
  hr: () => <hr className="border-border my-3" />,
}

export default function GeminiOutput({
  text,
  className,
  ref,
}: {
  text: string
  className?: string
  ref?: React.Ref<HTMLDivElement>
}) {
  return (
    <div ref={ref} className={cn('text-sm text-text-primary leading-[1.7] break-words', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
        {text}
      </ReactMarkdown>
    </div>
  )
}
