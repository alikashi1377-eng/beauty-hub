import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ hasError = false, className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full rounded-xl border px-3.5 py-2 text-sm text-[#120F1D] bg-white placeholder:text-[#756F86]/80 transition-colors focus:outline-none focus:ring-2 min-h-[42px] ${
          hasError
            ? 'border-red-600 focus:border-red-600 focus:ring-red-600/20'
            : 'border-[#D0CADF] hover:border-[#2A0F54]/40 focus:border-[#2A0F54] focus:ring-[#2A0F54]/15'
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
        className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-[#120F1D] bg-white placeholder:text-[#756F86]/80 transition-colors focus:outline-none focus:ring-2 ${
          hasError
            ? 'border-red-600 focus:border-red-600 focus:ring-red-600/20'
            : 'border-[#D0CADF] hover:border-[#2A0F54]/40 focus:border-[#2A0F54] focus:ring-[#2A0F54]/15'
        } ${className}`}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
