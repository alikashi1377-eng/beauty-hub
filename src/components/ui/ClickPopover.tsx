import React, { useEffect, useRef, useState } from 'react';
import { HelpCircle, Info, X } from 'lucide-react';

export interface ClickPopoverProps {
  /** متن دکمه بازکننده پاپ‌اور */
  triggerLabel?: string;
  /** نام مستعار متن دکمه بازکننده پاپ‌اور */
  label?: string;
  /** عنوان داخل پاپ‌اور */
  title: string;
  /** محتوای داخل پاپ‌اور */
  children: React.ReactNode;
  /** آیکون دکمه: info یا help */
  iconType?: 'info' | 'help';
  /** تم رنگی دکمه */
  tone?: 'blue' | 'violet' | 'emerald' | 'amber' | 'slate';
  /** تراز افقی پاپ‌اور */
  align?: 'right' | 'left' | 'center' | 'start' | 'end';
  /** کلاس سفارشی دکمه */
  className?: string;
}

export const ClickPopover: React.FC<ClickPopoverProps> = ({
  triggerLabel,
  label,
  title,
  children,
  iconType = 'info',
  tone = 'blue',
  align = 'right',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const resolvedLabel = triggerLabel || label || 'راهنما';

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toneClasses: Record<NonNullable<ClickPopoverProps['tone']>, string> = {
    blue: isOpen
      ? 'bg-[#0057FF] text-white border-[#0057FF] shadow-xs'
      : 'bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#0057FF] border-[#BFDBFE]',
    violet: isOpen
      ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-xs'
      : 'bg-[#F5F3FF] hover:bg-[#EDE9FE] text-[#7C3AED] border-[#DDD6FE]',
    emerald: isOpen
      ? 'bg-[#059669] text-white border-[#059669] shadow-xs'
      : 'bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#059669] border-[#A7F3D0]',
    amber: isOpen
      ? 'bg-[#D97706] text-white border-[#D97706] shadow-xs'
      : 'bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]',
    slate: isOpen
      ? 'bg-[#061138] text-white border-[#061138] shadow-xs'
      : 'bg-[#F8FAFC] hover:bg-[#E2E8F0] text-[#334155] border-[#CBD5E1]',
  };

  const alignClasses: Record<NonNullable<ClickPopoverProps['align']>, string> =
    {
      right: 'right-0',
      start: 'right-0',
      left: 'left-0',
      end: 'left-0',
      center: 'left-1/2 -translate-x-1/2',
    };

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-extrabold transition-all cursor-pointer select-none ${toneClasses[tone]}`}
      >
        {iconType === 'help' ? (
          <HelpCircle className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <Info className="w-3.5 h-3.5 shrink-0" />
        )}
        <span>{resolvedLabel}</span>
      </button>

      {isOpen ? (
        <div
          role="dialog"
          aria-label={title}
          className={`absolute top-full mt-2 z-40 w-72 sm:w-80 max-w-[88vw] rounded-2xl bg-white border border-[#CBD5E1] shadow-[0_18px_45px_-12px_rgba(6,17,56,0.25)] p-3.5 text-right space-y-2 animate-in fade-in zoom-in-95 duration-150 ${alignClasses[align]}`}
        >
          <div className="flex items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-[#061138]">
              <Info className="w-3.5 h-3.5 text-[#0057FF] shrink-0" />
              <span>{title}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="بستن راهنما"
              className="w-6 h-6 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-[11px] sm:text-xs text-[#334155] leading-relaxed space-y-1.5">
            {children}
          </div>
        </div>
      ) : null}
    </div>
  );
};
