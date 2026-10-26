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

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  tone = 'neutral',
}) => {
  const styles = {
    success: 'text-[#059669] bg-[#ECFDF5] border-[#10B981]/30',
    warning: 'text-[#D97706] bg-[#FFFBEB] border-[#F59E0B]/35',
    danger: 'text-[#EF4444] bg-[#FEF2F2] border-[#EF4444]/30',
    info: 'text-[#7C3AED] bg-[#EDE9FE] border-[#A78BFA]/40',
    primary: 'text-[#7C3AED] bg-[#EDE9FE] border-[#A78BFA]/40',
    accent: 'text-[#6D28D9] bg-[#F3EEFF] border-[#A78BFA]/40',
    neutral: 'text-[#6B6480] bg-[#F3EEFF] border-[#E6E0F5]',
  };

  const icons = {
    success: <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" aria-hidden="true" />,
    warning: <Clock className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" aria-hidden="true" />,
    danger: <AlertCircle className="w-3.5 h-3.5 text-[#EF4444] shrink-0" aria-hidden="true" />,
    info: <Info className="w-3.5 h-3.5 text-[#8B5CF6] shrink-0" aria-hidden="true" />,
    primary: <Info className="w-3.5 h-3.5 text-[#8B5CF6] shrink-0" aria-hidden="true" />,
    accent: <Info className="w-3.5 h-3.5 text-[#A78BFA] shrink-0" aria-hidden="true" />,
    neutral: <MinusCircle className="w-3.5 h-3.5 text-[#6B6480] shrink-0" aria-hidden="true" />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold whitespace-nowrap ${styles[tone]}`}
    >
      {icons[tone]}
      <span>{label}</span>
    </span>
  );
};
