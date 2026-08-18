import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const variants = {
      primary: 'bg-orange-500 text-black hover:bg-orange-400 hover:scale-[1.02] hover:-translate-y-[1px] shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] active:scale-95 transition-all duration-300',
      secondary: 'bg-zinc-900/50 backdrop-blur-md border border-zinc-800 text-white hover:bg-zinc-800 hover:scale-[1.02] hover:-translate-y-[1px] active:scale-95 transition-all duration-300',
      outline: 'border border-zinc-700 bg-transparent hover:bg-zinc-800 text-white hover:scale-[1.02] hover:-translate-y-[1px] active:scale-95 transition-all duration-300',
      ghost: 'bg-transparent hover:bg-zinc-800/50 text-zinc-300 transition-all duration-300',
      danger: 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 hover:scale-[1.02] active:scale-95 transition-all duration-300',
    };
    
    const sizes = {
      sm: 'px-4 py-2 text-sm rounded-full font-medium',
      md: 'px-6 py-2.5 text-sm rounded-full font-medium tracking-wide',
      lg: 'px-8 py-3.5 text-base rounded-full font-semibold tracking-wide',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
