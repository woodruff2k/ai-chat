import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI 캐릭터 채팅",
  description: "AI 캐릭터와 함께하는 스트리밍 대화 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-slate-900 text-slate-50">{children}</body>
    </html>
  );
}
