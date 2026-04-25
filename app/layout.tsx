import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "カルテAI | 整体院・鍼灸院向け施術メモ",
  description: "音声でカルテを自動作成。次回来院時に前回サマリーを自動表示。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${geistSans.variable} h-full`}>
      <body className="min-h-full bg-gray-50 text-gray-900 antialiased">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
          <span className="text-2xl">🩺</span>
          <span className="font-bold text-lg tracking-tight">カルテAI</span>
          <span className="text-sm text-gray-500 ml-2">整体院・鍼灸院向け施術メモ</span>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
