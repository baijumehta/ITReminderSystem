import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IT Reminders",
  description: "Track IT renewals and recurring tasks, with daily Teams reminders until they're done.",
};

// Every page reads live data from the database.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50 text-slate-800">
        <header className="border-b border-slate-200 bg-white">
          <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-indigo-600 text-sm text-white">✓</span>
              IT Reminders
            </Link>
            <div className="flex gap-4 text-sm">
              <Link href="/" className="text-slate-600 hover:text-slate-900">Tasks</Link>
              <Link href="/preview" className="text-slate-600 hover:text-slate-900">Teams message</Link>
            </div>
            <Link
              href="/tasks/new"
              className="ml-auto rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              + New task
            </Link>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
