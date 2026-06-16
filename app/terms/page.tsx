import Link from 'next/link'
import AppBar from '@/components/AppBar'

export const metadata = {
  title: '서비스 이용약관 — 프롬프트 아레나',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-bg-base">
      <AppBar title="서비스 이용약관" showBack backHref="/" />

      <main className="max-w-[430px] md:max-w-2xl mx-auto px-5 pt-6 pb-16">
        <p className="text-xs text-text-faint mb-8">시행일: 2026년 6월 11일</p>

        <Section title="제1조 (목적)">
          이 약관은 프롬프트 아레나(이하 &quot;서비스&quot;)의 이용 조건 및 절차, 이용자와 운영자의 권리·의무·책임 사항을 규정합니다.
        </Section>

        <Section title="제2조 (정의)">
          <ul className="list-disc pl-4 flex flex-col gap-1">
            <li><b>서비스</b>: AI 프롬프트 경진대회 플랫폼 &quot;프롬프트 아레나&quot;</li>
            <li><b>이용자</b>: 서비스에 접속하여 이 약관에 따라 서비스를 이용하는 자</li>
            <li><b>챌린지</b>: 서비스 내 진행되는 AI 프롬프트 작성 대회 단위</li>
            <li><b>출품작</b>: 이용자가 제출한 프롬프트 및 AI 생성 결과물</li>
          </ul>
        </Section>

        <Section title="제3조 (약관의 효력 및 변경)">
          <ol className="list-decimal pl-4 flex flex-col gap-1">
            <li>이 약관은 서비스 내 게시함으로써 효력이 발생합니다.</li>
            <li>운영자는 합리적인 사유가 있을 경우 약관을 변경할 수 있으며, 변경 시 서비스 내 공지합니다.</li>
            <li>변경된 약관에 동의하지 않을 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
          </ol>
        </Section>

        <Section title="제4조 (서비스 이용)">
          <ol className="list-decimal pl-4 flex flex-col gap-1">
            <li>서비스는 로그인 없이 출품작·결과물 구경이 가능합니다. 프롬프트 생성·제출·투표는 로그인이 필요합니다.</li>
            <li>이용자는 챌린지당 최대 3회 프롬프트를 생성할 수 있으며, 그 중 1개를 제출할 수 있습니다.</li>
            <li>제출된 출품작은 수정·삭제가 불가합니다.</li>
            <li>투표는 챌린지당 최대 3표이며, 본인 출품작에도 투표할 수 있습니다.</li>
            <li>3표를 모두 사용한 경우 해당 챌린지의 전체 프롬프트를 열람할 수 있습니다.</li>
          </ol>
        </Section>

        <Section title="제5조 (금지 행위)">
          이용자는 다음 행위를 하여서는 안 됩니다.
          <ul className="list-disc pl-4 flex flex-col gap-1 mt-2">
            <li>다중 계정을 이용한 투표 조작</li>
            <li>욕설, 혐오 표현, 음란 콘텐츠 제출</li>
            <li>서비스 운영을 방해하는 행위</li>
            <li>타인의 저작물을 무단으로 도용하는 행위</li>
            <li>자동화 도구(봇)를 이용한 대량 요청</li>
          </ul>
          금지 행위 적발 시 서비스 이용이 제한될 수 있습니다.
        </Section>

        <Section title="제6조 (콘텐츠의 권리)">
          <ol className="list-decimal pl-4 flex flex-col gap-1">
            <li>이용자가 작성한 프롬프트의 저작권은 이용자에게 있습니다.</li>
            <li>이용자는 서비스 내 출품작을 제출함으로써 운영자에게 서비스 운영·개선·홍보 목적의 이용 권한을 부여합니다.</li>
            <li>AI 생성 결과물의 저작권은 관련 법령 및 생성 AI 서비스 약관에 따릅니다.</li>
          </ol>
        </Section>

        <Section title="제7조 (코인 및 보상)">
          <ol className="list-decimal pl-4 flex flex-col gap-1">
            <li>코인은 서비스 내 활동(제출·투표·우승 등)에 따라 적립됩니다.</li>
            <li>MVP 기간 중 코인의 현금화·환전은 지원하지 않습니다.</li>
            <li>운영상 불가피한 사유로 코인 제도가 변경될 수 있습니다.</li>
          </ol>
        </Section>

        <Section title="제8조 (서비스의 변경 및 중단)">
          운영자는 서비스의 내용·방식을 변경하거나 운영상·기술상의 이유로 서비스를 중단할 수 있습니다. 이로 인한 손해에 대해 운영자는 책임을 지지 않습니다.
        </Section>

        <Section title="제9조 (면책 조항)">
          <ol className="list-decimal pl-4 flex flex-col gap-1">
            <li>운영자는 천재지변, 서비스 장애 등 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
            <li>AI 생성 결과물의 정확성·신뢰성에 대해 운영자는 보증하지 않습니다.</li>
            <li>이용자 간 또는 이용자와 제3자 간의 분쟁에 대해 운영자는 개입하지 않습니다.</li>
          </ol>
        </Section>

        <Section title="제10조 (문의)">
          서비스 이용 관련 문의는 아래로 연락해 주세요.
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
