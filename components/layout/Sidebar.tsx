'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutGrid, Settings, FileText, Sparkles } from 'lucide-react';

interface SidebarProps {
  isAdmin?: boolean;
}

export default function Sidebar({ isAdmin = false }: SidebarProps) {
  const pathname = usePathname();

  const links = [
    { href: '/projects', label: 'Projects', icon: LayoutGrid },
    { href: '/blog', label: 'Blog', icon: FileText },
    ...(isAdmin
      ? [{ href: '/admin/settings', label: 'Admin Settings', icon: Settings }]
      : []),
  ];

  return (
    <aside className="w-60 shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col">
      <div className="h-16 flex items-center gap-2 px-6 border-b border-zinc-800">
        <Sparkles className="h-5 w-5 text-indigo-500" />
        <span className="font-semibold text-zinc-100">Canvas</span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {links.map((link) => {
          const active = pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-indigo-600/10 text-indigo-400'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
