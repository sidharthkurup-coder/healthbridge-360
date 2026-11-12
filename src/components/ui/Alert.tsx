import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  className,
}) => {
  const configs = {
    info: {
      bg: 'bg-teal-50/80 border-teal-200 text-teal-900',
      icon: <Info className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />,
    },
    success: {
      bg: 'bg-emerald-50/80 border-emerald-200 text-emerald-900',
      icon: <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />,
    },
    warning: {
      bg: 'bg-amber-50/80 border-amber-200 text-amber-900',
      icon: <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />,
    },
    danger: {
      bg: 'bg-rose-50/80 border-rose-200 text-rose-900',
      icon: <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />,
    },
  };

  const { bg, icon } = configs[type];

  return (
    <div className={clsx('border rounded-xl p-4 flex gap-3 text-sm leading-relaxed', bg, className)}>
      {icon}
      <div className="flex-1">
        {title && <h5 className="font-semibold text-slate-900 mb-0.5">{title}</h5>}
        <div className="text-slate-700">{children}</div>
      </div>
    </div>
  );
};
