import * as React from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/lib/types';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:
          'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
        success:
          'bg-success-bg-light dark:bg-success-bg-dark text-success-dark dark:text-success-light',
        warning:
          'bg-warning-bg-light dark:bg-warning-bg-dark text-warning-dark dark:text-warning-light',
        error:
          'bg-error-bg-light dark:bg-error-bg-dark text-error-dark dark:text-error-light',
        info:
          'bg-info-bg-light dark:bg-info-bg-dark text-info-dark dark:text-info-light',
        magenta:
          'bg-magenta/10 dark:bg-magenta/20 text-magenta-dark dark:text-magenta-light',
        outline:
          'border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
}

function Badge({ className, variant, icon, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      {children}
    </div>
  );
}

// Helper to get the correct variant for an order status
export function getOrderStatusBadgeVariant(status: OrderStatus): 'success' | 'warning' | 'info' | 'default' | 'error' {
  switch (status) {
    case 'new':
      return 'info';
    case 'scheduled':
      return 'warning';
    case 'installed':
      return 'success';
    case 'completed':
      return 'default';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
}

// Order Status Badge component
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const variant = getOrderStatusBadgeVariant(status);
  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return <Badge variant={variant}>{label}</Badge>;
}

export { Badge, badgeVariants };
