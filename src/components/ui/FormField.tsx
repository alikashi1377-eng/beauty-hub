import React from 'react';

export interface FormFieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  optionalLabel?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  hint,
  error,
  required = false,
  optionalLabel,
  children,
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={id}
          className="text-xs sm:text-sm font-semibold text-[#1E1B2E]"
        >
          {label}
          {required ? (
            <span className="text-[#8B5CF6] mr-1" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
        {optionalLabel ? (
          <span className="text-[11px] text-[#6B6480]">{optionalLabel}</span>
        ) : null}
      </div>
      {children}
      {error ? (
        <p role="alert" className="text-xs font-medium text-[#EF4444]">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-[#6B6480] leading-relaxed">{hint}</p>
      ) : null}
    </div>
  );
};
