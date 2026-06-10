import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

export const metadata: Metadata = {
  title: "프롬프트 아레나 — AI 프롬프트 대회",
  description: "최고의 AI 프롬프트를 만들고 경쟁하세요. 매일 새로운 챌린지에 참여하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col bg-bg-base">
        <NextTopLoader color="oklch(58.8% 0.158 241.966)" height={2} showSpinner={false} />
        {children}
      </body>
    </html>
  );
}
