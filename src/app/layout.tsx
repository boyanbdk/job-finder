import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Job Finder — Boyan",
  description: "Curated remote/freelance platform tracker + live job aggregator",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex w-full max-w-6xl items-center gap-5 px-5 py-3">
            <span className="font-bold text-slate-900">🎯 Job Finder</span>
            <nav className="flex gap-1 text-sm">
              <Link
                href="/"
                className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                Live Jobs
              </Link>
              <Link
                href="/platforms"
                className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                Platform Tracker
              </Link>
            </nav>
            <span className="ml-auto hidden text-xs text-slate-400 sm:block">
              Sofia · BG / EN / DE · remote
            </span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-6">{children}</main>
      </body>
    </html>
  );
}
