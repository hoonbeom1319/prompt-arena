'use client'

interface CoinDisplayProps {
  balance: number
  size?: 'sm' | 'md' | 'lg'
}

export default function CoinDisplay({ balance, size = 'md' }: CoinDisplayProps) {
  const sizes = {
    sm: { font: '13px', icon: '12px', padding: '3px 8px' },
    md: { font: '14px', icon: '14px', padding: '4px 10px' },
    lg: { font: '18px', icon: '18px', padding: '6px 14px' },
  }

  const s = sizes[size]

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: s.padding,
      backgroundColor: 'var(--accent-light)',
      borderRadius: 'var(--radius-full)',
      border: '1px solid color-mix(in oklab, var(--accent) 32%, white)',
    }}>
      <span style={{ fontSize: s.icon }}>🪙</span>
      <span style={{
        fontSize: s.font,
        fontWeight: '700',
        color: 'var(--accent)',
      }}>
        {balance.toLocaleString()}
      </span>
    </div>
  )
}
