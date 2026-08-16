import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

const title = "달 관측 기록 복원소";
const description = "앞뒤 관측 기록을 근거로 사라진 달 모양을 찾아 넣는 초등 과학 학습 앱";
const socialDescription = "앞뒤 기록을 살펴 빈 달 모양을 찾아요";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost";
  const protocol = requestHeaders.get("x-forwarded-proto") === "http" ? "http" : "https";

  return {
    metadataBase: new URL(`${protocol}://${host}`),
    title,
    description,
    openGraph: {
      title,
      description: socialDescription,
      images: [{ url: "/og.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: socialDescription,
      images: ["/og.png"],
    },
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
  };
}

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
