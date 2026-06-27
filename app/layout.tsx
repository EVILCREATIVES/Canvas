import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";

export const metadata: Metadata = {
  title: "Canvas — collaborative production canvas for storytellers",
  description:
    "An infinite canvas with an AI script-to-storyboard pipeline. Sketch an idea, generate a script, break it into shots, storyboard, animate.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="flex items-center justify-between px-6 py-4 border-b border-canvas-border">
          <Link href="/" className="font-semibold tracking-tight text-lg">
            Canvas
          </Link>
          <nav className="flex gap-5 text-sm text-zinc-400">
            <Link href="/projects" className="hover:text-white">
              Projects
            </Link>
            <Link href="/blog" className="hover:text-white">
              Blog
            </Link>
            <Link href="/admin" className="hover:text-white">
              Admin
            </Link>
          </nav>
        </header>
        <main className="min-h-[calc(100vh-65px)]">{children}</main>
      </body>
    </html>
  );
}
