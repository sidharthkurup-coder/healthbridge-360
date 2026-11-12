import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = React.memo(
  ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    icon,
    className,
    disabled,
    ...props
  }) => {
    const baseStyles =
      'group inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] focus:outline-none focus:ring-2 focus:ring-offset-2 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100 select-none transform-gpu';

    const variantStyles = {
      primary:
        'btn-sheen bg-gradient-to-b from-navy-800 to-navy-950 text-white hover:from-navy-700 hover:to-navy-900 focus:ring-navy-700 shadow-sm hover:shadow-md border border-navy-700/50',
      secondary:
        'btn-sheen bg-gradient-to-b from-teal-500 to-teal-600 text-white hover:from-teal-400 hover:to-teal-500 focus:ring-teal-500 shadow-sm hover:shadow-glow-teal border border-teal-400/30',
      outline:
        'border border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50 hover:border-teal-300 hover:text-navy-950 focus:ring-teal-500 shadow-2xs hover:shadow-xs',
      danger:
        'btn-sheen bg-gradient-to-b from-rose-500 to-rose-600 text-white hover:from-rose-400 hover:to-rose-500 focus:ring-rose-500 shadow-sm hover:shadow-glow-rose border border-rose-400/30',
      success:
        'btn-sheen bg-gradient-to-b from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 focus:ring-emerald-500 shadow-sm hover:shadow-md border border-emerald-400/30',
      ghost:
        'text-slate-600 hover:bg-slate-100/80 hover:text-navy-950 focus:ring-slate-400',
    };

    const sizeStyles = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2.5 gap-2',
      lg: 'text-base px-5 py-3 gap-2.5',
    };

    return (
      <button
        className={clsx(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin -ml-1 mr-1.5 h-4 w-4 text-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : icon ? (
          <span className="shrink-0 transition-transform duration-200 ease-out group-hover:scale-110 group-hover:-rotate-3">
            {icon}
          </span>
        ) : null}
        <span>{children}</span>
      </button>
    );
  }
);
Button.displayName = 'Button';
