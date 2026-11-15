import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'emerald' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'gold',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-charcoal-900 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

    const sizeStyles = {
      sm: 'text-xs px-3.5 py-2 min-h-[36px] space-x-1.5',
      md: 'text-sm px-5 py-2.5 min-h-[44px] space-x-2',
      lg: 'text-base px-6 py-3 min-h-[50px] space-x-2.5 font-semibold tracking-wide',
    };

    const variantStyles = {
      gold: 'bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 text-charcoal-950 shadow-md hover:shadow-gold-glow hover:brightness-105 focus:ring-gold-400 border border-gold-300 font-semibold',
      emerald:
        'bg-felt-800 text-cream-100 border border-felt-600 hover:bg-felt-700 hover:border-gold-500/50 shadow-md focus:ring-felt-500',
      outline:
        'bg-charcoal-800/80 text-cream-100 border border-charcoal-600 hover:border-gold-500 hover:text-gold-300 hover:bg-charcoal-700 focus:ring-gold-500',
      ghost:
        'bg-transparent text-cream-200 hover:text-white hover:bg-charcoal-800/60 focus:ring-gray-500',
      danger:
        'bg-ruby-700/80 text-cream-100 border border-ruby-600 hover:bg-ruby-600 focus:ring-ruby-500',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${
          fullWidth ? 'w-full' : ''
        } ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
