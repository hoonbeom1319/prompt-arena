// UI 크롬 아이콘 단일 출처 (ARCHITECTURE §3.1). 인라인 SVG·파일 내부 const XxxIcon 금지 — 전부 여기서 import.
//
// 설계: 스트로크 계열 아이콘은 root <svg>에 stroke·strokeWidth·linecap을 두고
// 내부 도형은 geometry(d 등)만 가진다. SVG presentation 속성은 자식이 상속하므로,
// 호출부는 width/height/strokeWidth/className(색)을 props로 넘겨 자유롭게 조정한다.
// props는 항상 기본값 뒤에 펼쳐지므로 호출부 값이 우선한다. 색은 currentColor.

type IconProps = React.ComponentProps<'svg'>

// 자물쇠 — 잠금/가림 표시 (login, BlindCard, vote, home 다음주제 잠금)
export function IconLock(props: IconProps) {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

// 왼쪽 화살표 — 뒤로 가기 (AppBar, login 헤더)
export function IconChevronLeft(props: IconProps) {
  return (
    <svg width={18} height={18} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M11 4L6 9l5 5" />
    </svg>
  )
}

// 체크 — 선택/완료/투표됨 (generate 시도선택, vote 투표배지, home 제출완료)
export function IconCheck(props: IconProps) {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

// 오른쪽 셰브론 — 펼침 트리거 (accordion). 펼침 시 90° 회전은 호출부에서 className으로.
export function IconChevronRight(props: IconProps) {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}

// 아래 셰브론 — 펼침 트리거 (ResultList). 펼침 시 180° 회전은 호출부에서.
export function IconChevronDown(props: IconProps) {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

// 트로피 — 우승/순위 (results 헤더·우승작, home TOP3)
export function IconTrophy(props: IconProps) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M8 21h8M12 17v4M7 4h10l1 7H6l1-7z" />
    </svg>
  )
}

// 로그아웃 (LogoutButton)
export function IconLogout(props: IconProps) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

// 톱니바퀴 — 운영자 (AdminShell)
export function IconGear(props: IconProps) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
    </svg>
  )
}

// 연필 — 인라인 편집 (NicknameEditor)
export function IconPencil(props: IconProps) {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

// 사람들 — 비로그인 안내 (home UserStatusCard)
export function IconUsers(props: IconProps) {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

// 달 — 빈 상태 (home idle)
export function IconMoon(props: IconProps) {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

// 번개 — 실행/생성 빈 상태 (generate)
export function IconZap(props: IconProps) {
  return (
    <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  )
}

// Google 로고 — 브랜드 멀티컬러 (login). currentColor 아님.
export function IconGoogle(props: IconProps) {
  return (
    <svg width={18} height={18} viewBox="0 0 18 18" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853" />
      <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  )
}

// ── 하단 탭바 내비 아이콘 — filled로 활성 상태 표시 ──

type NavIconProps = IconProps & { filled?: boolean }

export function IconHome({ filled, ...props }: NavIconProps) {
  return (
    <svg width={21} height={21} viewBox="0 0 21 21" fill="none" aria-hidden="true" {...props}>
      <path d="M3.5 9.5L10.5 3.5L17.5 9.5V18.5H13.5V13.5H7.5V18.5H3.5V9.5Z" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconClock({ filled, ...props }: NavIconProps) {
  return (
    <svg width={21} height={21} viewBox="0 0 21 21" fill="none" aria-hidden="true" {...props}>
      <circle cx="10.5" cy="10.5" r="7.5" fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.12 : 0} stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 7V10.5L13 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconQuiz({ filled, ...props }: NavIconProps) {
  return (
    <svg width={21} height={21} viewBox="0 0 21 21" fill="none" aria-hidden="true" {...props}>
      <circle cx="10.5" cy="10.5" r="7.5" fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.12 : 0} stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.5 8.3a2 2 0 1 1 2.7 1.9c-.6.2-.9.6-.9 1.2v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10.4" cy="14.4" r="0.85" fill="currentColor" />
    </svg>
  )
}

export function IconPerson({ filled, ...props }: NavIconProps) {
  return (
    <svg width={21} height={21} viewBox="0 0 21 21" fill="none" aria-hidden="true" {...props}>
      <circle cx="10.5" cy="7.5" r="3" fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.15 : 0} stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.5 19C4.5 15.134 7.134 12 10.5 12C13.866 12 16.5 15.134 16.5 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
