import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TFiberLogoProps {
  /** Logo variant */
  variant?: 'full' | 'icon' | 'text';
  /** Size of the logo */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Theme - auto-detects if not specified */
  theme?: 'light' | 'dark' | 'magenta';
  /** Additional className */
  className?: string;
}

const sizeMap = {
  xs: 'h-4',   // 16px
  sm: 'h-6',   // 24px
  md: 'h-8',   // 32px (default)
  lg: 'h-10',  // 40px
  xl: 'h-14',  // 56px
};

const textSizeMap = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-2xl',
};

const gapMap = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-2',
  lg: 'gap-3',
  xl: 'gap-3',
};

export function TFiberLogo({
  variant = 'full',
  size = 'md',
  theme,
  className,
}: TFiberLogoProps) {
  const sizeClass = sizeMap[size];
  const textSize = textSizeMap[size];
  const gapSize = gapMap[size];

  // Theme-based fill for SVG
  const getFillClass = () => {
    if (theme === 'magenta') return 'fill-[#E20074]';
    if (theme === 'light') return 'fill-gray-900';
    if (theme === 'dark') return 'fill-white';
    // Auto-detect
    return 'fill-magenta dark:fill-white';
  };

  const fillClass = getFillClass();

  // Official T-Mobile logo SVG (from T-Mobile_Logo_Alternative_0.svg)
  const TMobileSVG = (
    <svg
      viewBox="0 0 192.2 213.4"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(sizeClass, 'w-auto', variant === 'icon' ? className : '')}
      aria-label={variant === 'icon' ? 'T-Mobile Fiber' : undefined}
      role={variant === 'icon' ? 'img' : undefined}
    >
      {variant === 'icon' && <title>T-Mobile Fiber</title>}
      {/* Main T shape */}
      <path
        className={fillClass}
        d="M96.1,165.7h29.1V159c-3.2,0-5.5-0.1-6.8-0.2c-4.5-0.4-7.7-1.6-9.6-3.6c-2.2-2.3-3.3-7.2-3.3-14.8v-31.9V53.4
          c9.8,0.3,17.5,3.5,23,9.7c5.3,5.9,8.5,15,9.7,27.3l6.3-1.1l-1.2-41.6H48.9l-1.2,41.6l6.3,1.1c1.2-12.3,4.4-21.4,9.7-27.3
          c5.5-6.2,13.2-9.5,23-9.7v55.1v31.9c0,7.6-1.1,12.5-3.3,14.8c-1.9,1.9-5.1,3.1-9.6,3.6c-1.3,0.1-3.6,0.2-6.8,0.2v6.7H96.1"
      />
      {/* Left square */}
      <rect className={fillClass} x="47.8" y="102" width="23.9" height="23.9" />
      {/* Right square */}
      <rect className={fillClass} x="120.6" y="102" width="23.9" height="23.9" />
    </svg>
  );

  // Icon variant - just the logo
  if (variant === 'icon') {
    return TMobileSVG;
  }

  // Text variant - text only
  if (variant === 'text') {
    return (
      <span className={cn('font-bold tracking-tight', textSize, className)}>
        T-Mobile{' '}
        <span className="text-gray-300 dark:text-gray-700 font-light">|</span>{' '}
        <span className={theme === 'magenta' ? 'text-[#E20074]' : ''}>Fiber</span>
      </span>
    );
  }

  // Full variant - logo + divider + "Fiber" text
  return (
    <div className={cn('flex items-center', gapSize, className)}>
      {TMobileSVG}
      <span className="text-gray-300 dark:text-gray-700 font-light select-none" aria-hidden="true">
        |
      </span>
      <span className={cn('font-semibold tracking-tight text-gray-900 dark:text-white', textSize)}>
        Fiber
      </span>
    </div>
  );
}

// Simple text logo for compact spaces (legacy support)
export function TFiberTextLogo({ className }: { className?: string }) {
  return (
    <span className={cn('font-bold text-gray-900 dark:text-white', className)}>
      T-Fiber{' '}
      <span className="text-magenta">Orders</span>
    </span>
  );
}
