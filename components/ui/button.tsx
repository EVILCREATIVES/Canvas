import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const variantClasses = {
  default: 'bg-indigo-600 text-white hover:bg-indigo-700',
  outline: 'border border-zinc-700 text-zinc-300 hover:bg-zinc-800',
  ghost: 'text-zinc-300 hover:bg-zinc-800',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
  secondary: 'bg-zinc-700 text-zinc-100 hover:bg-zinc-600',
  link: 'text-indigo-400 underline-offset-4 hover:underline p-0',
};

const sizeClasses = {
  default: 'h-9 px-4 py-2 text-sm',
  sm: 'h-7 px-3 text-xs',
  lg: 'h-11 px-8 text-base',
  icon: 'h-9 w-9',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:pointer-events-none',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
