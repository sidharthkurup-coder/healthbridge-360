'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

/**
 * Shared singleton IntersectionObserver pool so all ScrollReveal and AnimatedCounter
 * elements share one browser observer instead of allocating N separate DOM observers.
 */
const revealCallbacks = new WeakMap<Element, () => void>();
let sharedRevealObserver: IntersectionObserver | null = null;

function getSharedRevealObserver(): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return null;
  if (!sharedRevealObserver) {
    sharedRevealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const cb = revealCallbacks.get(entry.target);
            if (cb) {
              cb();
              revealCallbacks.delete(entry.target);
            }
            sharedRevealObserver?.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }
    );
  }
  return sharedRevealObserver;
}

/**
 * 1. ScrollReveal — GPU-accelerated singleton IntersectionObserver spring reveal
 *    with automatic `will-change: auto` release upon completion.
 */
interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: 'up' | 'left' | 'right' | 'scale';
  delayMs?: number;
  className?: string;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = React.memo(
  ({ children, direction = 'up', delayMs = 0, className }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [state, setState] = useState<'hidden' | 'visible' | 'settled'>('hidden');

    useEffect(() => {
      const node = ref.current;
      if (!node) return;

      const obs = getSharedRevealObserver();
      if (!obs) {
        setState('settled');
        return;
      }

      revealCallbacks.set(node, () => setState('visible'));
      obs.observe(node);
      return () => {
        revealCallbacks.delete(node);
        obs.unobserve(node);
      };
    }, []);

    const handleTransitionEnd = useCallback(
      (e: React.TransitionEvent<HTMLDivElement>) => {
        if (e.target === ref.current && state === 'visible') {
          setState('settled');
        }
      },
      [state]
    );

    const hiddenClass = {
      up: 'reveal-hidden-up',
      left: 'reveal-hidden-left',
      right: 'reveal-hidden-right',
      scale: 'reveal-hidden-scale',
    }[direction];

    return (
      <div
        ref={ref}
        onTransitionEnd={handleTransitionEnd}
        style={state === 'visible' && delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
        className={clsx(
          state === 'hidden'
            ? hiddenClass
            : state === 'visible'
            ? 'reveal-visible'
            : 'reveal-settled',
          className
        )}
      >
        {children}
      </div>
    );
  }
);
ScrollReveal.displayName = 'ScrollReveal';

/**
 * 2. AnimatedCounter — Quintic spring count-up pooled on the shared IntersectionObserver
 *    with frame-deduplicated React state updates and completion micro-pop.
 */
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = React.memo(
  ({ value, duration = 1150, prefix = '', suffix = '', decimals = 0, className }) => {
    const targetNum = Number(value) || 0;
    const [displayValue, setDisplayValue] = useState(targetNum);
    const [popped, setPopped] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);
    const hasAnimated = useRef(false);
    const lastFormattedRef = useRef<string>('');

    const formatNumber = useCallback(
      (num: number) => (decimals > 0 ? num.toFixed(decimals) : Math.round(num).toLocaleString()),
      [decimals]
    );

    useEffect(() => {
      const node = ref.current;
      if (!node) return;

      let rafId = 0;

      const startAnimation = () => {
        const target = Number(value) || 0;
        const prefersReduced =
          typeof window !== 'undefined' &&
          window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        if (target === 0 || prefersReduced) {
          setDisplayValue(target);
          return;
        }
        setDisplayValue(0);
        const startTime = performance.now();

        const tick = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Quintic spring-out: 1 - (1 - t)^5
          const eased = 1 - Math.pow(1 - progress, 5);
          const current = target * eased;
          const nextFormatted = formatNumber(current);

          if (nextFormatted !== lastFormattedRef.current) {
            lastFormattedRef.current = nextFormatted;
            setDisplayValue(current);
          }

          if (progress < 1) {
            rafId = requestAnimationFrame(tick);
          } else {
            lastFormattedRef.current = formatNumber(target);
            setDisplayValue(target);
            setPopped(true);
          }
        };

        rafId = requestAnimationFrame(tick);
      };

      const obs = getSharedRevealObserver();
      if (!obs) {
        hasAnimated.current = true;
        setDisplayValue(Number(value) || 0);
        return;
      }

      revealCallbacks.set(node, () => {
        if (!hasAnimated.current) {
          hasAnimated.current = true;
          startAnimation();
        }
      });
      obs.observe(node);

      return () => {
        revealCallbacks.delete(node);
        obs.unobserve(node);
        if (rafId) cancelAnimationFrame(rafId);
      };
    }, [value, duration, formatNumber]);

    useEffect(() => {
      if (hasAnimated.current) {
        const target = Number(value) || 0;
        lastFormattedRef.current = formatNumber(target);
        setDisplayValue(target);
      }
    }, [value, formatNumber]);

    return (
      <span
        ref={ref}
        className={clsx('tabular-nums', popped && 'animate-counter-pop', className)}
      >
        {prefix}
        {formatNumber(displayValue)}
        {suffix}
      </span>
    );
  }
);
AnimatedCounter.displayName = 'AnimatedCounter';

/**
 * 3. LiveEcgWave — Animated clinical ECG waveform SVG with dual-harmonic glow trace
 */
export const LiveEcgWave: React.FC<{ className?: string; color?: string }> = React.memo(
  ({ className = 'w-28 h-7', color = '#2dd4bf' }) => {
    return (
      <svg
        viewBox="0 0 140 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={clsx('overflow-visible', className)}
        aria-hidden="true"
      >
        <path
          d="M 2 16 L 32 16 L 38 10 L 44 22 L 50 16 L 66 16 L 72 24 L 78 3 L 84 29 L 90 12 L 96 16 L 138 16"
          stroke={color}
          strokeOpacity="0.18"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 2 16 L 32 16 L 38 10 L 44 22 L 50 16 L 66 16 L 72 24 L 78 3 L 84 29 L 90 12 L 96 16 L 138 16"
          stroke={color}
          strokeOpacity="0.35"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-ecg-trace blur-[2px]"
        />
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
  }
);
LiveEcgWave.displayName = 'LiveEcgWave';

/**
 * 4. Magnetic — Tactile spring cursor pull wrapper for hero CTAs
 */
export const Magnetic: React.FC<{
  children: React.ReactNode;
  strength?: number;
  className?: string;
}> = React.memo(({ children, strength = 0.22, className }) => {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const rectRef = useRef<DOMRect | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (ref.current) {
      rectRef.current = ref.current.getBoundingClientRect();
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const node = ref.current;
      if (!node) return;
      const clientX = e.clientX;
      const clientY = e.clientY;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const rect = rectRef.current || node.getBoundingClientRect();
        const dx = (clientX - (rect.left + rect.width / 2)) * strength;
        const dy = (clientY - (rect.top + rect.height / 2)) * strength;
        node.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)`;
      });
    },
    [strength]
  );

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (ref.current) {
      ref.current.style.transform = 'translate3d(0px, 0px, 0)';
    }
    rectRef.current = null;
  }, []);

  return (
    <div
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={clsx(
        'inline-block transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform',
        className
      )}
    >
      {children}
    </div>
  );
});
Magnetic.displayName = 'Magnetic';

/**
 * 5. RouteProgressBar — Instant route transition comet bar + passive GPU scroll progress indicator
 */
export const RouteProgressBar: React.FC = React.memo(() => {
  const pathname = usePathname();
  const [animating, setAnimating] = useState(false);
  const scrollBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAnimating(true);
    const timer = setTimeout(() => setAnimating(false), 480);
    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    let rafId = 0;
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        const bar = scrollBarRef.current;
        if (!bar) return;
        const doc = document.documentElement;
        const maxScroll = doc.scrollHeight - doc.clientHeight;
        const ratio = maxScroll > 20 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
        bar.style.transform = `scaleX(${ratio.toFixed(4)})`;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [pathname]);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[2.5px] bg-transparent pointer-events-none overflow-hidden">
      {/* Passive GPU Scroll Progress Line */}
      <div
        ref={scrollBarRef}
        style={{ transform: 'scaleX(0)', transformOrigin: '0% 50%' }}
        className="absolute inset-0 bg-gradient-to-r from-teal-400 via-sky-400 to-emerald-400 opacity-85 transition-transform duration-75 ease-out will-change-transform"
      />
      {/* Route Transition Comet Bar */}
      {animating && (
        <div
          className="relative h-full bg-gradient-to-r from-teal-300 via-sky-400 to-emerald-300 shadow-[0_0_16px_rgba(45,212,191,0.9)] animate-grow-width"
          style={{ width: '100%' }}
        />
      )}
    </div>
  );
});
RouteProgressBar.displayName = 'RouteProgressBar';


// ============================================================================
// 6. AWARD-WINNING PAGE TRANSITION STAGE (3D Perspective Spring + Aurora Veil)
// ============================================================================
export const PageTransitionStage: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const pathname = usePathname();
    const [animating, setAnimating] = useState(true);

    useEffect(() => {
        setAnimating(true);
        const timer = window.setTimeout(() => {
            setAnimating(false);
        }, 680);
        return () => window.clearTimeout(timer);
    }, [pathname]);

    return (
        <div className="relative">
            {animating && (
                <>
                    <div
                        aria-hidden="true"
                        className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[2px] bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_20px_rgba(45,212,191,0.9)] animate-veil-sweep"
                    />
                    <div
                        aria-hidden="true"
                        className="pointer-events-none fixed inset-x-0 top-14 z-40 h-36 bg-gradient-to-b from-teal-400/12 via-sky-400/6 to-transparent blur-sm animate-veil-sweep"
                    />
                </>
            )}
            <div
                key={pathname}
                onAnimationEnd={(e) => {
                    if (e.target === e.currentTarget) {
                        setAnimating(false);
                    }
                }}
                className={animating ? 'animate-page-enter' : undefined}
            >
                {children}
            </div>
        </div>
    );
};

// ============================================================================
// 7. HERO CURSOR AURORA FIELD (Zero-Rerender RAF Spotlight Layer)
// ============================================================================
export const HeroAuroraField: React.FC<{ children: React.ReactNode; className?: string }> = React.memo(
    ({ children, className }) => {
        const ref = useRef<HTMLElement>(null);
        const rafRef = useRef<number>(0);
        const rectRef = useRef<DOMRect | null>(null);

        const handleMouseEnter = useCallback(() => {
            if (ref.current) {
                rectRef.current = ref.current.getBoundingClientRect();
            }
        }, []);

        const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
            const node = ref.current;
            if (!node) return;
            const cx = e.clientX;
            const cy = e.clientY;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(() => {
                const rect = rectRef.current || node.getBoundingClientRect();
                node.style.setProperty('--hero-x', `${(cx - rect.left).toFixed(1)}px`);
                node.style.setProperty('--hero-y', `${(cy - rect.top).toFixed(1)}px`);
            });
        }, []);

        const handleMouseLeave = useCallback(() => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rectRef.current = null;
        }, []);

        return (
            <section
                ref={ref}
                onMouseEnter={handleMouseEnter}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className={clsx('relative overflow-hidden', className)}
            >
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 hero-aurora-spotlight"
                />
                {children}
            </section>
        );
    }
);
HeroAuroraField.displayName = 'HeroAuroraField';
