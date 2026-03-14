import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { ToastProvider } from "@/components/ToastProvider";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ChowonSMS | 예약자 문자발송 관리",
  description: "숙소 업체를 위한 커스텀 SMS 자동발송 관리 웹앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSansKr.variable} antialiased`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
