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
          className="text-xs sm:text-sm font-semibold text-[#120F1D]"
        >
          {label}
          {required ? (
            <span className="text-[#9D174D] mr-1" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
        {optionalLabel ? (
          <span className="text-[11px] text-[#756F86]">{optionalLabel}</span>
        ) : null}
      </div>
      {children}
      {error ? (
        <p role="alert" className="text-xs font-medium text-red-700">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-[#756F86] leading-relaxed">{hint}</p>
      ) : null}
    </div>
  );
};
