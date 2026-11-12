'use client';

import React, { useCallback, useRef } from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = React.memo(
  ({ children, className, hoverEffect = false, onMouseEnter, onMouseMove, onMouseLeave, ...props }) => {
    const rafRef = useRef<number>(0);
    const rectRef = useRef<DOMRect | null>(null);

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        rectRef.current = e.currentTarget.getBoundingClientRect();
        if (onMouseEnter) onMouseEnter(e);
      },
      [onMouseEnter]
    );

    const handleMouseMove = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const clientX = e.clientX;
        const clientY = e.clientY;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          const rect = rectRef.current || target.getBoundingClientRect();
          const x = clientX - rect.left;
          const y = clientY - rect.top;
          target.style.setProperty('--spot-x', `${x.toFixed(1)}px`);
          target.style.setProperty('--spot-y', `${y.toFixed(1)}px`);

          if (hoverEffect && rect.width > 0 && rect.height > 0) {
            const normX = (x / rect.width - 0.5) * 2;
            const normY = (y / rect.height - 0.5) * 2;
            target.style.setProperty('--rx', `${(-normY * 2.6).toFixed(2)}deg`);
            target.style.setProperty('--ry', `${(normX * 2.6).toFixed(2)}deg`);
          }
        });
        if (onMouseMove) onMouseMove(e);
      },
      [hoverEffect, onMouseMove]
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rectRef.current = null;
        if (hoverEffect) {
          const target = e.currentTarget;
          target.style.setProperty('--rx', '0deg');
          target.style.setProperty('--ry', '0deg');
        }
        if (onMouseLeave) onMouseLeave(e);
      },
      [hoverEffect, onMouseLeave]
    );

    return (
      <div
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={clsx(
          'perf-card bg-white border border-slate-200/85 rounded-2xl shadow-soft overflow-hidden transform-gpu',
          hoverEffect
            ? 'spotlight-surface hover:shadow-elevated hover:border-teal-300/90 group'
            : 'card-interactive hover:border-slate-300/90 hover:shadow-md',
          className
        )}
        {...props}
      >
        <div className="relative z-10 h-full flex flex-col justify-between">{children}</div>
      </div>
    );
  }
);
Card.displayName = 'Card';

export const CardHeader: React.FC<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = React.memo(({ title, subtitle, action, className }) => (
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
));
CardHeader.displayName = 'CardHeader';

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = React.memo(
  ({ children, className }) => <div className={clsx('p-6', className)}>{children}</div>
);
CardContent.displayName = 'CardContent';
