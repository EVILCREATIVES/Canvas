import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-zinc-950">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <Sparkles className="h-6 w-6 text-indigo-500" />
        <span className="font-semibold text-xl">Canvas</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
