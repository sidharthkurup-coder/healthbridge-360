'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

/**
 * 1. ScrollReveal — GPU-accelerated IntersectionObserver spring reveal
 */
interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: 'up' | 'left' | 'right' | 'scale';
  delayMs?: number;
  className?: string;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  direction = 'up',
  delayMs = 0,
  className,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const hiddenClass = {
    up: 'reveal-hidden-up',
    left: 'reveal-hidden-left',
    right: 'reveal-hidden-right',
    scale: 'reveal-hidden-scale',
  }[direction];

  return (
    <div
      ref={ref}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
      className={clsx(visible ? 'reveal-visible' : hiddenClass, className)}
    >
      {children}
    </div>
  );
};

/**
 * 2. AnimatedCounter — Smooth requestAnimationFrame count-up on viewport entry
 */
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1100,
  prefix = '',
  suffix = '',
  decimals = 0,
  className,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let rafId = 0;

    const startAnimation = () => {
      const startTime = performance.now();
      const target = Number(value) || 0;

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Cubic ease-out: 1 - (1 - t)^3
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = target * eased;
        setDisplayValue(current);

        if (progress < 1) {
          rafId = requestAnimationFrame(tick);
        } else {
          setDisplayValue(target);
        }
      };

      rafId = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            startAnimation();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [value, duration]);

  // Also update if value changes dynamically after initial animation
  useEffect(() => {
    if (hasAnimated.current) {
      setDisplayValue(Number(value) || 0);
    }
  }, [value]);

  const formatted =
    decimals > 0
      ? displayValue.toFixed(decimals)
      : Math.round(displayValue).toLocaleString();

  return (
    <span ref={ref} className={clsx('tabular-nums', className)}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};

/**
 * 3. LiveEcgWave — Animated clinical ECG waveform SVG
 */
export const LiveEcgWave: React.FC<{ className?: string; color?: string }> = ({
  className = 'w-28 h-7',
  color = '#2dd4bf',
}) => {
  return (
    <svg
      viewBox="0 0 140 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx('overflow-visible', className)}
      aria-hidden="true"
    >
      {/* Faint background baseline trace */}
      <path
        d="M 2 16 L 32 16 L 38 10 L 44 22 L 50 16 L 66 16 L 72 24 L 78 3 L 84 29 L 90 12 L 96 16 L 138 16"
        stroke={color}
        strokeOpacity="0.2"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Animated active pulse trace */}
      <path
        d="M 2 16 L 32 16 L 38 10 L 44 22 L 50 16 L 66 16 L 72 24 L 78 3 L 84 29 L 90 12 L 96 16 L 138 16"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-ecg-trace"
      />
    </svg>
  );
};

/**
 * 4. RouteProgressBar — Instant top bar feedback on page transitions
 */
export const RouteProgressBar: React.FC = () => {
  const pathname = usePathname();
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setAnimating(true);
    const timer = setTimeout(() => setAnimating(false), 450);
    return () => clearTimeout(timer);
  }, [pathname]);

  if (!animating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-transparent pointer-events-none overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-teal-400 via-sky-400 to-emerald-400 shadow-glow-teal animate-grow-width"
        style={{ width: '100%' }}
      />
    </div>
  );
};
