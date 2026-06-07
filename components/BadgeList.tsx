interface Badge {
  id: string
  name: string
  description: string
  icon: string
}

interface BadgeListProps {
  badges: Badge[]
  emptyMessage?: string
}

export default function BadgeList({ badges, emptyMessage = '아직 획득한 뱃지가 없어요' }: BadgeListProps) {
  if (badges.length === 0) {
    return (
      <div style={{
        padding: '24px',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '14px',
      }}>
        {emptyMessage}
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
    }}>
      {badges.map(badge => (
        <div
          key={badge.id}
          title={badge.description}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            padding: '16px',
            backgroundColor: 'var(--bg-base)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            minWidth: '80px',
            cursor: 'default',
          }}
        >
          <span style={{ fontSize: '28px' }}>{badge.icon}</span>
          <span style={{
            fontSize: '11px',
            fontWeight: '600',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            lineHeight: '1.3',
          }}>
            {badge.name}
          </span>
        </div>
      ))}
    </div>
  )
}
