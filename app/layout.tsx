import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "달 관측 기록 복원소",
  description: "앞뒤 관측 기록을 근거로 사라진 달 모양을 복원하는 초등 과학 학습 앱",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
