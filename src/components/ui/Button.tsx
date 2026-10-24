import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  className = '',
  children,
  disabled,
  type = 'button',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2A0F54] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap shrink-0 cursor-pointer active:scale-[0.99]';

  const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary:
      'bg-[#2A0F54] text-white hover:bg-[#1D093B] border border-transparent',
    accent:
      'bg-[#9D174D] text-white hover:bg-[#831843] border border-transparent',
    secondary:
      'bg-slate-900 text-white hover:bg-slate-800 border border-transparent',
    outline:
      'border border-[#D0CADF] bg-white text-[#120F1D] hover:bg-[#F4F3F8] hover:border-[#2A0F54]/40',
    ghost:
      'bg-transparent text-[#4A4458] hover:bg-[#F4F3F8] hover:text-[#120F1D] border border-transparent',
    danger:
      'bg-red-700 text-white hover:bg-red-800 border border-transparent',
  };

  const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'px-3.5 py-1.5 text-xs min-h-[36px]',
    md: 'px-4 py-2 text-xs sm:text-sm min-h-[42px]',
    lg: 'px-6 py-2.5 text-sm sm:text-base min-h-[46px]',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : null}
      {children}
    </button>
  );
};
