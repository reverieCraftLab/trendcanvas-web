import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 한글 웹폰트. Geist에는 한글 글자가 없어서 접속한 기기에 한글 폰트가 없으면 네모(□)로 깨진다.
// 한글은 글자 수가 많아 Google Fonts가 여러 조각으로 나눠 필요한 조각만 내려받게 하므로
// 특정 subset을 미리 로딩(preload)하지 않는다.
const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  weight: ["400", "500", "600", "700"],
  preload: false,
});

export const metadata: Metadata = {
  title: "TrendCanvas",
  description: "요즘 뜨는 디저트 트렌드를 한눈에 보는 갤러리",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansKr.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
