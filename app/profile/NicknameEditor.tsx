'use client'

import { useActionState, useState } from 'react'
import { updateNickname } from './actions'
import { Input } from '@/ds/input'
import { Button } from '@/ds/button'

type State = { error?: string; success?: boolean } | null

export function NicknameEditor({ nickname }: { nickname: string }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(nickname)
  // 성공 시 편집모드 종료는 effect 안에서 setState 하는 대신(cascading render 유발)
  // action 래퍼에서 결과를 받아 처리한다 — 이벤트성 흐름이라 권장 패턴.
  const [state, action, pending] = useActionState<State, FormData>(async (prev, formData) => {
    const result = await updateNickname(prev, formData)
    if (result?.success) setEditing(false)
    return result
  }, null)

  if (!editing) {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[15px] font-bold text-text-primary truncate">{nickname}</span>
        <button
          onClick={() => { setValue(nickname); setEditing(true) }}
          className="text-text-muted hover:text-text-secondary transition-colors shrink-0"
          aria-label="닉네임 수정"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-1.5 w-full">
      <div className="flex gap-1.5 items-center">
        <Input
          name="nickname"
          value={value}
          onChange={e => setValue(e.target.value)}
          maxLength={20}
          className="h-9 text-sm py-0"
          autoFocus
          disabled={pending}
        />
        <Button type="submit" size="sm" className="h-9 shrink-0" disabled={pending}>
          저장
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="h-9 shrink-0"
          onClick={() => { setValue(nickname); setEditing(false) }}
          disabled={pending}
        >
          취소
        </Button>
      </div>
      {state?.error && (
        <p className="text-xs text-error">{state.error}</p>
      )}
    </form>
  )
}
