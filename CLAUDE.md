@AGENTS.md

# 프로젝트 철학

이 프로젝트는 "개발에 AI를 보조로 쓰는" 실험이 아니다.
**AI 주도 개발 프로세스 자체를 설계하고 검증하는** 실험적 프로젝트다.

의사결정, 설계, 컨벤션 정립, 구현 모두 AI가 주도하고 사람이 방향을 잡는다.
따라서 아래 컨벤션들은 단순한 스타일 가이드가 아니라,
AI와 사람이 같은 기준으로 협업하기 위한 **공유 언어**다.

# Code Conventions

## Function Style

### React 컴포넌트 → `function` 선언문

**이유 1 — React DevTools에서 이름이 자동으로 붙는다.**
`const Button = () => ...`로 쓰면 번들러 설정에 따라 DevTools에 `Anonymous`로 보이거나, 컴포넌트 트리에서 이름을 추적하기 어려워진다. `function Button()`은 항상 이름이 보장된다.

**이유 2 — 에러 스택트레이스가 읽기 쉽다.**
런타임 에러 발생 시 `function` 선언 컴포넌트는 스택에 `Button`이 그대로 찍힌다. 화살표 함수는 `eval`이나 `<anonymous>`로 찍히는 경우가 있다.

**이유 3 — 호이스팅으로 파일 구조를 자유롭게 잡을 수 있다.**
`function`은 파일 어디에 선언해도 호출할 수 있다. 덕분에 메인 컴포넌트를 파일 상단에, 서브 컴포넌트를 하단에 자연스럽게 배치할 수 있다. `const`는 선언 전에 참조하면 TDZ(Temporal Dead Zone) 에러가 난다.

**이유 4 — "이건 컴포넌트"라는 신호가 코드에서 즉시 보인다.**
`function`이 줄 맨 앞에 오면 컴포넌트임을 한눈에 식별할 수 있다. `const`로 시작하면 컴포넌트인지 상수인지 오른쪽까지 읽어야 알 수 있다.

### 유틸 / 헬퍼 / 인라인 콜백 → 화살표 함수

**이유 1 — `this`가 없어야 안전하다.**
유틸 함수나 이벤트 핸들러에서 `this`가 바인딩되면 버그의 원인이 된다. 화살표 함수는 `this`를 갖지 않으므로 실수할 여지가 없다.

**이유 2 — 값(value)으로서의 함수 의도를 명확히 한다.**
`const handleClick = () => ...`는 "이 변수에 함수를 담는다"는 의도가 분명하다. 함수 선언문처럼 이름이 호이스팅돼서 어디서나 호출되는 개체가 아니라, 특정 스코프에 묶인 값임을 나타낸다.

**이유 3 — 간결함.**
`const double = (x: number) => x * 2`처럼 단순 변환 로직은 화살표가 훨씬 읽기 좋다. `function` 키워드와 `return`을 쓰면 오히려 노이즈가 된다.

```tsx
// ✅ 컴포넌트 — function 선언
export default function Button({ variant, ...props }: ButtonProps) { ... }
function InternalSubComponent() { ... }

// ✅ 유틸 / 핸들러 — 화살표
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
const handleClick = () => setOpen(true)
const double = (x: number) => x * 2

// ❌ 금지 — 컴포넌트를 화살표로 (DevTools·스택트레이스 손해)
export const Button = ({ variant }: ButtonProps) => { ... }

// ❌ 금지 — 유틸을 function 선언으로 (값으로서의 의도 불명확, 호이스팅 불필요)
export function cn(...inputs: ClassValue[]) { ... }
```

## React 19 — ref는 일반 prop

`forwardRef`는 사용하지 않는다. React 19부터 `ref`는 일반 prop.

```tsx
// ✅
function Input({ ref, className, ...props }: React.ComponentProps<'input'>) {
  return <input ref={ref} className={cn(base, className)} {...props} />
}

// ❌ 금지
const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => ...)
```

## 폴더 구조 — 기술 역할별 분류

이 프로젝트는 **"이 코드가 기술적으로 무엇인가"** 를 기준으로 폴더를 나눈다.

```
app/          라우트 및 페이지 (Next.js App Router 컨벤션)
components/   여러 페이지에서 공유되는 UI 컴포넌트
ds/           디자인 시스템 프리미티브 (Button, Input, Card …)
lib/          유틸리티, 외부 서비스 클라이언트 (supabase, utils)
```

새 코드를 추가할 때 판단 기준:

| 추가하려는 것 | 위치 |
|--------------|------|
| 특정 URL에만 쓰이는 UI | `app/[route]/` 안에 colocate |
| 2개 이상 페이지에서 쓰이는 컴포넌트 | `components/` |
| 색상·크기·variant가 있는 UI 원자 | `ds/` |
| API 클라이언트, 순수 함수 유틸 | `lib/` |

**도메인(기능)별로 폴더를 만들지 않는다.** `features/challenge/`, `features/auth/` 같은 구조는 이 프로젝트의 방식이 아니다. 그 판단이 필요한 시점이 오면 별도로 결정한다.

## DS 컴포넌트 경로

공통 UI는 `ds/` 폴더에서 임포트한다. `globals.css`의 레거시 `.btn-*` / `.input` / `.badge` 클래스는 신규 코드에서 사용하지 않는다.
