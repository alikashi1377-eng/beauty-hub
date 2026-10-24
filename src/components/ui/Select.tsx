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
        className={`w-full rounded-xl border px-3.5 py-2 text-sm text-[#120F1D] bg-white transition-colors focus:outline-none focus:ring-2 min-h-[42px] cursor-pointer ${
          hasError
            ? 'border-red-600 focus:border-red-600 focus:ring-red-600/20'
            : 'border-[#D0CADF] hover:border-[#2A0F54]/40 focus:border-[#2A0F54] focus:ring-[#2A0F54]/15'
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
