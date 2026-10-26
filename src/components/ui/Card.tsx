import React from 'react';

export interface CardProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'muted' | 'interactive' | 'dark';
}

export const Card: React.FC<CardProps> = ({
  id,
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
    default:
      'bg-[#FFFFFF] border-[#CBD5E1] text-[#061138] shadow-[0_4px_20px_-4px_rgba(6,17,56,0.06)]',
    muted: 'bg-[#E8EFFA] border-[#CBD5E1] text-[#061138]',
    interactive:
      'bg-[#FFFFFF] border-[#CBD5E1] text-[#061138] shadow-[0_6px_24px_-6px_rgba(6,17,56,0.08)] hover:border-[#0057FF] hover:shadow-[0_14px_34px_-8px_rgba(0,87,255,0.18)] hover:-translate-y-0.5 transition-all duration-200',
    dark: 'bg-[#061138] border-[#1E293B] text-white shadow-[0_12px_32px_-8px_rgba(6,17,56,0.35)]',
  };

  return (
    <div
      id={id}
      className={`rounded-3xl border ${variantMap[variant]} ${paddingMap[padding]} ${className}`}
    >
      {children}
    </div>
  );
};
