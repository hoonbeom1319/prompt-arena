'use client'

import { Button } from '@/ds/button'
import Modal from '@/ds/modal'

interface RecoverModalProps {
  recoverableStreak: number // 끊긴 직전 연승 (회복 시 유지될 값)
  recoverCost: number       // 회복 비용 (코인)
  balance: number           // 현재 코인 잔액
  loading: boolean
  error: string | null
  onRecover: () => void
  onDismiss: () => void
}

// 연승 회복 제안 팝업 (PRD v1.4 4.7.6). 틀린 직후 그 자리에서만 결정 — 닫으면 0 확정(소급 불가).
export default function RecoverModal({
  recoverableStreak,
  recoverCost,
  balance,
  loading,
  error,
  onRecover,
  onDismiss,
}: RecoverModalProps) {
  const affordable = balance >= recoverCost

  // 배경 클릭으로 닫히지 않게 한다 — 회복/포기를 명시적으로 선택하게(소급 불가라 실수 방지).
  return (
    <Modal onClose={onDismiss} closeOnBackdrop={false} labelledBy="recover-title" className="p-6">
      <div className="text-center">
        <div className="text-4xl mb-3" aria-hidden="true">💔</div>
        <p id="recover-title" className="text-lg font-bold text-text-primary">
          {recoverableStreak}연승이 끊겼어요
        </p>
        <p className="text-sm text-text-secondary mt-2 leading-relaxed">
          코인 <span className="font-bold text-accent">{recoverCost}개</span>로 연승을 지킬 수 있어요.
          <br />
          지금이 아니면 회복할 수 없어요.
        </p>
      </div>

      <div className="mt-4 rounded-lg bg-bg-subtle px-4 py-2.5 text-center">
        <span className="text-xs text-text-muted">보유 코인 </span>
        <span className={`text-sm font-bold ${affordable ? 'text-text-primary' : 'text-red-500'}`}>
          {balance}개
        </span>
      </div>

      {!affordable && (
        <p className="text-xs text-red-500 text-center mt-3">
          코인이 부족해 회복할 수 없어요.
        </p>
      )}
      {error && <p className="text-xs text-red-500 text-center mt-3">{error}</p>}

      <div className="mt-5 flex flex-col gap-2">
        <Button
          type="button"
          variant="primary"
          onClick={onRecover}
          disabled={loading || !affordable}
        >
          {loading ? '회복 중…' : `코인 ${recoverCost}개로 지키기`}
        </Button>
        <Button type="button" variant="ghost" onClick={onDismiss} disabled={loading}>
          포기하기
        </Button>
      </div>
    </Modal>
  )
}
