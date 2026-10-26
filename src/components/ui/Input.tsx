import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ hasError = false, className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full font-sans font-normal rounded-2xl border px-4 py-2.5 text-sm text-[#1E1B2E] bg-white placeholder:text-[#6B6480]/75 transition-all focus:outline-none focus:ring-2 min-h-[44px] ${
          hasError
            ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/15'
            : 'border-[#E6E0F5] hover:border-[#A78BFA] focus:border-[#8B5CF6] focus:ring-[#8B5CF6]/18'
        } ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ hasError = false, className = '', rows = 3, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={`w-full font-sans font-normal rounded-2xl border px-4 py-2.5 text-sm text-[#1E1B2E] bg-white placeholder:text-[#6B6480]/75 transition-all focus:outline-none focus:ring-2 ${
          hasError
            ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/15'
            : 'border-[#E6E0F5] hover:border-[#A78BFA] focus:border-[#8B5CF6] focus:ring-[#8B5CF6]/18'
        } ${className}`}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
