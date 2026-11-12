import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'slate' | 'teal' | 'emerald' | 'amber' | 'rose' | 'sky' | 'purple';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = React.memo(
  ({ children, variant = 'slate', size = 'md', dot, className }) => {
    const variantStyles = {
      slate: 'bg-slate-100/90 text-slate-700 border-slate-200/90',
      teal: 'bg-teal-50/90 text-teal-800 border-teal-200/90',
      emerald: 'bg-emerald-50/90 text-emerald-800 border-emerald-200/90',
      amber: 'bg-amber-50/90 text-amber-800 border-amber-200/90',
      rose: 'bg-rose-50/90 text-rose-800 border-rose-200/90',
      sky: 'bg-sky-50/90 text-sky-800 border-sky-200/90',
      purple: 'bg-purple-50/90 text-purple-800 border-purple-200/90',
    };

    const dotColors = {
      slate: 'bg-slate-500',
      teal: 'bg-teal-500',
      emerald: 'bg-emerald-500',
      amber: 'bg-amber-500',
      rose: 'bg-rose-500',
      sky: 'bg-sky-500',
      purple: 'bg-purple-500',
    };

    const sizeStyles = {
      sm: 'text-[10px] px-2 py-0.5 font-semibold',
      md: 'text-[11px] px-2.5 py-0.5 font-bold',
    };

    const textStr = typeof children === 'string' ? children.toUpperCase() : '';
    const shouldPulse =
      dot ||
      textStr.includes('CRITICAL') ||
      textStr.includes('DISPATCHED') ||
      textStr.includes('LIVE') ||
      textStr.includes('AVAILABLE') ||
      textStr.includes('ON DUTY') ||
      textStr.includes('అత్యవసరం') ||
      textStr.includes('పంపబడింది') ||
      textStr.includes('లైవ్') ||
      textStr.includes('లభ్యం');

    return (
      <span
        className={clsx(
          'inline-flex items-center gap-1.5 rounded-full border tracking-wider uppercase shadow-2xs transition-all duration-200',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
      >
        {shouldPulse && (
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span
              className={clsx(
                'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                dotColors[variant]
              )}
            />
            <span
              className={clsx('relative inline-flex rounded-full h-1.5 w-1.5', dotColors[variant])}
            />
          </span>
        )}
        {children}
      </span>
    );
  }
);
Badge.displayName = 'Badge';
