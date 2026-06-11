import Link from 'next/link'
import AppBar from '@/components/AppBar'

export const metadata = {
  title: '개인정보처리방침 — 프롬프트 아레나',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg-base">
      <AppBar title="개인정보처리방침" showBack backHref="/" />

      <main className="max-w-[430px] md:max-w-2xl mx-auto px-5 pt-6 pb-16">
        <p className="text-xs text-text-faint mb-8">시행일: 2026년 6월 11일</p>

        <p className="text-sm text-text-secondary leading-[1.8] mb-8">
          프롬프트 아레나(이하 "서비스")는 개인정보보호법에 따라 이용자의 개인정보를 보호하고, 이와 관련한 고충을 신속하게 처리하기 위해 다음과 같이 개인정보처리방침을 수립·공개합니다.
        </p>

        <Section title="1. 수집하는 개인정보">
          <table className="w-full text-xs border-collapse mt-2">
            <thead>
              <tr className="bg-bg-subtle">
                <Th>항목</Th>
                <Th>수집 방법</Th>
                <Th>필수 여부</Th>
              </tr>
            </thead>
            <tbody>
              <Tr items={['이메일 주소', '회원가입·소셜 로그인', '필수']} />
              <Tr items={['닉네임', '회원가입 시 입력', '필수']} />
              <Tr items={['구글 계정 정보 (소셜 로그인 시)', 'OAuth', '선택']} />
              <Tr items={['서비스 이용 기록 (생성·제출·투표 내역)', '자동 수집', '필수']} />
              <Tr items={['코인 거래 내역', '자동 수집', '필수']} />
            </tbody>
          </table>
        </Section>

        <Section title="2. 개인정보의 수집·이용 목적">
          <ul className="list-disc pl-4 flex flex-col gap-1">
            <li>회원 식별 및 서비스 제공</li>
            <li>챌린지 참여 기록 관리 (3회 생성 한도, 3표 투표 한도 적용)</li>
            <li>코인·뱃지 적립 및 내역 관리</li>
            <li>부정 이용 방지 및 서비스 운영·개선</li>
            <li>공지사항 전달 및 문의 응대</li>
          </ul>
        </Section>

        <Section title="3. 개인정보의 보유 및 이용 기간">
          <ul className="list-disc pl-4 flex flex-col gap-1">
            <li>회원 탈퇴 시까지 보관합니다.</li>
            <li>관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.</li>
            <li>탈퇴 후에는 지체 없이 파기하되, 챌린지 결과의 무결성 보호를 위해 익명화된 참여 기록은 보존될 수 있습니다.</li>
          </ul>
        </Section>

        <Section title="4. 개인정보의 제3자 제공">
          서비스는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 단, 아래의 경우는 예외입니다.
          <ul className="list-disc pl-4 flex flex-col gap-1 mt-2">
            <li>이용자가 사전에 동의한 경우</li>
            <li>법령의 규정에 의하거나, 수사 기관의 요구가 있는 경우</li>
          </ul>
        </Section>

        <Section title="5. 개인정보 처리 위탁">
          서비스는 원활한 운영을 위해 아래와 같이 개인정보 처리를 위탁합니다.
          <table className="w-full text-xs border-collapse mt-2">
            <thead>
              <tr className="bg-bg-subtle">
                <Th>수탁업체</Th>
                <Th>위탁 업무</Th>
              </tr>
            </thead>
            <tbody>
              <Tr items={['Supabase Inc.', '데이터베이스 및 인증 서비스']} />
              <Tr items={['Vercel Inc.', '서버 호스팅 및 배포']} />
              <Tr items={['Google LLC', '소셜 로그인 (OAuth), AI 생성(Gemini API)']} />
            </tbody>
          </table>
        </Section>

        <Section title="6. 이용자의 권리">
          이용자는 언제든지 다음의 권리를 행사할 수 있습니다.
          <ul className="list-disc pl-4 flex flex-col gap-1 mt-2">
            <li>개인정보 열람 요청</li>
            <li>오류 정정 요청</li>
            <li>삭제 요청 (회원 탈퇴)</li>
            <li>처리 정지 요청</li>
          </ul>
          권리 행사는 아래 연락처로 요청해 주세요.
        </Section>

        <Section title="7. 쿠키 및 자동 수집">
          서비스는 로그인 상태 유지를 위해 브라우저 쿠키 및 로컬 스토리지를 사용합니다. 브라우저 설정을 통해 쿠키를 거부할 수 있으나, 이 경우 로그인 등 일부 기능이 제한될 수 있습니다.
        </Section>

        <Section title="8. 개인정보 보호책임자 및 문의">
          <p>개인정보 처리에 관한 문의, 불만 처리, 피해 구제 등에 관한 사항은 아래로 연락해 주세요.</p>
          <p className="mt-2">이메일: hoonbeom1319@gmail.com</p>
        </Section>

        <div className="mt-10 pt-6 border-t border-border flex gap-4 text-xs text-text-muted">
          <Link href="/terms" className="underline">이용약관</Link>
          <Link href="/privacy" className="underline">개인정보처리방침</Link>
        </div>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <h2 className="text-sm font-bold text-text-primary mb-2">{title}</h2>
      <div className="text-sm text-text-secondary leading-[1.8]">{children}</div>
    </section>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left px-2 py-1.5 font-semibold text-text-muted border border-border">
      {children}
    </th>
  )
}

function Tr({ items }: { items: string[] }) {
  return (
    <tr>
      {items.map((item, i) => (
        <td key={i} className="px-2 py-1.5 border border-border text-text-secondary">
          {item}
        </td>
      ))}
    </tr>
  )
}
