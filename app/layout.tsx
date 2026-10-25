import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";

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

// 큰 제목용 명조체. 매거진 표지 같은 인상을 주는 핵심 요소라 제목에만 쓴다.
const notoSerifKr = Noto_Serif_KR({
  variable: "--font-noto-serif-kr",
  weight: ["500", "700"],
  preload: false,
});

// 검색엔진과 링크 미리보기(카카오톡, 슬랙 등)가 읽는 정보다.
// metadataBase는 아래의 상대 경로('/')를 완전한 주소로 바꿀 때 쓰는 기준이다.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  // 같은 페이지가 여러 주소로 열려도(예: Vercel 임시 주소) 대표 주소는 하나라고 알려 준다.
  alternates: { canonical: "/" },
  // 링크를 공유할 때 보이는 미리보기. 이미지는 아직 없어서 제목과 설명만 둔다.
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansKr.variable} ${notoSerifKr.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
