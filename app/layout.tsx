import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "カルテAI | 整体院・鍼灸院向け施術メモ",
  description: "音声でカルテを自動作成。次回来院時に前回サマリーを自動表示。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${notoSansJP.variable} h-full`}>
      <body className="min-h-full antialiased">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-stone-200">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span
                className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center text-white text-lg shadow-sm group-hover:shadow-md transition-shadow"
                aria-hidden
              >
                ✓
              </span>
              <span className="flex flex-col leading-tight">
                <span className="font-bold text-base text-stone-900 tracking-tight">カルテAI</span>
                <span className="text-[11px] text-stone-500">整体院・鍼灸院 施術メモ</span>
              </span>
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-5 sm:px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
