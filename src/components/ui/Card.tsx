import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'muted' | 'interactive' | 'dark';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  variant = 'default',
}) => {
  const paddingMap = {
    none: '',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  const variantMap = {
    default: 'bg-white border-[#E6E3EE] text-[#120F1D]',
    muted: 'bg-[#F4F3F8] border-[#E6E3EE] text-[#120F1D]',
    interactive:
      'bg-white border-[#E6E3EE] text-[#120F1D] hover:border-[#2A0F54]/45 transition-colors duration-150',
    dark: 'bg-[#170B2B] border-[#2D1950] text-white',
  };

  return (
    <div
      className={`rounded-2xl border ${variantMap[variant]} ${paddingMap[padding]} ${className}`}
    >
      {children}
    </div>
  );
};
