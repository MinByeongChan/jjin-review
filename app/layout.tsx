import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "찐 후기",
  description: "광고성 리뷰는 걷어내고 구매에 도움 되는 후기만 정리합니다."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
