import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getAdminSettings } from '@/lib/settings';
import ModelSettings from '@/components/admin/ModelSettings';
import { Sparkles, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'admin') redirect('/projects');

  const settings = await getAdminSettings();

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="h-16 flex items-center justify-between px-6 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-500" />
          <span className="font-semibold">Canvas Admin</span>
        </div>
        <Link
          href="/projects"
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to app
        </Link>
      </header>
      <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Settings</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Configure AI models, rules, and the system prompt used across the
            platform.
          </p>
        </div>
        <ModelSettings initial={settings} />
      </div>
    </div>
  );
}
