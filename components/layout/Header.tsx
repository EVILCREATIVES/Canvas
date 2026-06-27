'use client';

import { signOut } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Bell, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu';

interface HeaderUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export default function Header({ user }: { user?: HeaderUser }) {
  const initials = (user?.name || user?.email || 'U')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-16 shrink-0 border-b border-zinc-800 bg-zinc-950 flex items-center justify-end gap-3 px-6">
      <Button variant="ghost" size="icon" aria-label="Notifications">
        <Bell className="h-5 w-5" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <Avatar>
              {user?.image && <AvatarImage src={user.image} alt="Avatar" />}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="z-50 min-w-[12rem] rounded-lg border border-zinc-800 bg-zinc-900 p-1 text-zinc-100 shadow-lg"
        >
          <DropdownMenuLabel className="px-3 py-2 text-sm">
            <p className="font-medium">{user?.name || 'User'}</p>
            <p className="text-xs text-zinc-500">{user?.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="my-1 h-px bg-zinc-800" />
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none hover:bg-zinc-800"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
