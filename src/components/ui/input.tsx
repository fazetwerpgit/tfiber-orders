import * as React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = React.useId();

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
            {props.required && (
              <span className="ml-1 text-error" aria-label="required">
                *
              </span>
            )}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            className={cn(
              // Base styles - CRITICAL: text-base (16px) to prevent iOS zoom
              'flex w-full rounded-lg border bg-white px-4 py-3 text-base transition-all duration-150',
              'placeholder:text-gray-400 dark:placeholder:text-gray-500',
              'dark:bg-gray-900 dark:text-white',
              // Focus states
              'focus:outline-none focus:ring-2 focus:ring-magenta/20 dark:focus:ring-magenta/30',
              // Border states
              error
                ? 'border-error focus:border-error focus:ring-error/20'
                : 'border-gray-200 dark:border-gray-700 focus:border-magenta',
              // Disabled state
              disabled &&
                'cursor-not-allowed opacity-50 bg-gray-50 dark:bg-gray-800',
              // Icon padding
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            ref={ref}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                ? `${inputId}-helper`
                : undefined
            }
            {...props}
          />
          {rightIcon && !error && (
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              {rightIcon}
            </div>
          )}
          {error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-error">
              <AlertCircle className="h-5 w-5" />
            </div>
          )}
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className="flex items-center gap-1 text-sm text-error"
            role="alert"
          >
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="text-sm text-gray-500 dark:text-gray-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
