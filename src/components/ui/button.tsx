import * as React from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-r from-magenta to-magenta-dark text-white shadow-md shadow-magenta/30 hover:shadow-lg hover:shadow-magenta/40 hover:-translate-y-0.5',
        secondary:
          'bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-magenta/30',
        ghost:
          'hover:bg-magenta/10 hover:text-magenta dark:hover:bg-magenta/20',
        outline:
          'border-2 border-magenta text-magenta hover:bg-magenta hover:text-white',
        destructive:
          'bg-error text-white hover:bg-error-dark shadow-md',
        success:
          'bg-success text-white hover:bg-success-dark shadow-md',
        link:
          'text-magenta underline-offset-4 hover:underline',
      },
      size: {
        xs: 'h-8 px-3 text-xs',
        sm: 'h-9 px-4 text-sm',
        md: 'min-h-[44px] px-6 py-3 text-base', // iOS minimum touch target
        lg: 'min-h-[52px] px-8 py-4 text-lg',
        icon: 'h-11 w-11', // 44px square for touch target
        'icon-sm': 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {children}
          </>
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
