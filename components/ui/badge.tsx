import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';
}

const variantClasses = {
  default: 'bg-indigo-600 text-white',
  secondary: 'bg-zinc-700 text-zinc-100',
  success: 'bg-green-600 text-white',
  warning: 'bg-yellow-600 text-white',
  destructive: 'bg-red-600 text-white',
  outline: 'border border-zinc-700 text-zinc-300',
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
