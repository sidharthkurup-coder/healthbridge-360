'use client';

import React, { useCallback } from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverEffect = false,
  onMouseMove,
  ...props
}) => {
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (hoverEffect) {
        const rect = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
        e.currentTarget.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
      }
      if (onMouseMove) onMouseMove(e);
    },
    [hoverEffect, onMouseMove]
  );

  return (
    <div
      onMouseMove={handleMouseMove}
      className={clsx(
        'bg-white border border-slate-200/85 rounded-2xl shadow-soft overflow-hidden transform-gpu transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
        hoverEffect &&
          'spotlight-surface hover:-translate-y-1.5 hover:shadow-elevated hover:border-teal-300/90 group',
        className
      )}
      {...props}
    >
      <div className="relative z-10 h-full flex flex-col justify-between">{children}</div>
    </div>
  );
};

export const CardHeader: React.FC<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, className }) => (
  <div
    className={clsx(
      'px-6 py-4 bg-gradient-to-r from-slate-50/70 via-white to-slate-50/40 border-b border-slate-100 flex items-center justify-between gap-4',
      className
    )}
  >
    <div>
      <h3 className="text-base font-bold text-navy-950 tracking-tight font-display">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <div className={clsx('p-6', className)}>{children}</div>;
