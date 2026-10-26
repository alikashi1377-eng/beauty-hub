import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  hasError?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, hasError = false, className = '', ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`w-full font-sans font-normal rounded-2xl border px-4 py-2.5 text-sm text-[#1E1B2E] bg-white transition-all focus:outline-none focus:ring-2 min-h-[44px] cursor-pointer ${
          hasError
            ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/15'
            : 'border-[#E6E0F5] hover:border-[#A78BFA] focus:border-[#8B5CF6] focus:ring-[#8B5CF6]/18'
        } ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }
);

Select.displayName = 'Select';
