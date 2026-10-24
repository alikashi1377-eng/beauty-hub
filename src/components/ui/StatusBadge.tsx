import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Info,
  MinusCircle,
} from 'lucide-react';

export interface StatusBadgeProps {
  label: string;
  tone?:
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'neutral'
    | 'primary'
    | 'accent';
}

/**
 * نمایش وضعیت با برچسب متنی صریح و آیکون معنایی (بدون کپسول‌های شلوغ یا نقطه چشمک‌زن)
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  tone = 'neutral',
}) => {
  const styles = {
    success: 'text-emerald-800',
    warning: 'text-amber-800',
    danger: 'text-red-700',
    info: 'text-[#2A0F54]',
    primary: 'text-[#2A0F54]',
    accent: 'text-[#9D174D]',
    neutral: 'text-[#756F86]',
  };

  const icons = {
    success: <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    warning: <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    danger: <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    info: <Info className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    primary: <Info className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    accent: <Info className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    neutral: <MinusCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${styles[tone]}`}
    >
      {icons[tone]}
      <span>{label}</span>
    </span>
  );
};
