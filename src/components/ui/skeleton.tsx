import * as React from 'react';
import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'skeleton rounded-md bg-gray-200 dark:bg-gray-800',
        className
      )}
      {...props}
    />
  );
}

// Pre-built skeleton patterns for common use cases

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-2/3' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

function SkeletonButton() {
  return <Skeleton className="h-11 w-24 rounded-lg" />;
}

function SkeletonAvatar() {
  return <Skeleton className="h-12 w-12 rounded-full" />;
}

function SkeletonOrderCard() {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
      <div className="flex items-start justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

function SkeletonMetricCard() {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export {
  Skeleton,
  SkeletonCard,
  SkeletonText,
  SkeletonButton,
  SkeletonAvatar,
  SkeletonOrderCard,
  SkeletonMetricCard,
};
