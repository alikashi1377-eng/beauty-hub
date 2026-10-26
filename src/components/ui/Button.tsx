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
    'inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0057FF] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap shrink-0 cursor-pointer active:scale-[0.98]';

  const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary:
      'bg-[#0057FF] text-white hover:bg-[#0044CC] border border-[#0044CC] shadow-[0_6px_18px_-4px_rgba(0,87,255,0.42)] hover:shadow-[0_10px_24px_-4px_rgba(0,68,204,0.52)]',
    accent:
      'bg-gradient-to-r from-[#0057FF] to-[#00C6FF] text-white hover:opacity-95 border border-transparent shadow-[0_6px_18px_-4px_rgba(0,198,255,0.45)]',
    secondary:
      'bg-[#E0ECFF] text-[#0057FF] hover:bg-[#CCE0FF] border border-[#93C5FD] font-bold',
    outline:
      'border border-[#CBD5E1] bg-white text-[#061138] hover:bg-[#F3F6FC] hover:border-[#0057FF] hover:text-[#0057FF]',
    ghost:
      'bg-transparent text-[#334155] hover:bg-[#E0ECFF]/70 hover:text-[#061138] border border-transparent',
    danger:
      'bg-[#EF4444] text-white hover:bg-[#DC2626] border border-transparent shadow-[0_6px_16px_-4px_rgba(239,68,68,0.32)]',
  };

  const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'px-4 py-1.5 text-xs min-h-[36px]',
    md: 'px-5 py-2 text-xs sm:text-sm min-h-[42px]',
    lg: 'px-6.5 py-2.5 text-sm sm:text-base min-h-[48px]',
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
