import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { HelpCircle, Info, X } from 'lucide-react';

export interface ClickPopoverProps {
  /** متن دکمه بازکننده پاپ‌اور (در حالت iconOnly نمایش داده نمی‌شود) */
  triggerLabel?: string;
  /** نام مستعار متن دکمه بازکننده پاپ‌اور */
  label?: string;
  /** نمایش صرفاً به صورت آیکون مینیمال بدون متن اضافی */
  iconOnly?: boolean;
  /** عنوان داخل پاپ‌اور */
  title: string;
  /** محتوای داخل پاپ‌اور */
  children: React.ReactNode;
  /** آیکون دکمه: info یا help */
  iconType?: 'info' | 'help';
  /** تم رنگی دکمه */
  tone?: 'blue' | 'violet' | 'emerald' | 'amber' | 'slate' | 'dark';
  /** تراز افقی پاپ‌اور */
  align?: 'right' | 'left' | 'center' | 'start' | 'end';
  /** عرض بیشتر پاپ‌اور برای توضیحات یا جداول کامل‌تر */
  wide?: boolean;
  /** کلاس سفارشی دکمه */
  className?: string;
}

export const ClickPopover: React.FC<ClickPopoverProps> = ({
  triggerLabel,
  label,
  iconOnly = false,
  title,
  children,
  iconType = 'info',
  tone = 'blue',
  align = 'right',
  wide = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [nudgeX, setNudgeX] = useState(0);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const resolvedLabel = triggerLabel ?? label ?? 'راهنما';
  const isMinimalIcon = iconOnly || resolvedLabel === '';

  useLayoutEffect(() => {
    if (!isOpen) {
      setNudgeX(0);
      setOpenUpward(false);
      return;
    }
    const el = popoverRef.current;
    const triggerEl = containerRef.current;
    if (!el || !triggerEl) return;
    // Reset before measuring so we compute fresh viewport bounds
    el.style.transform = '';
    const rect = el.getBoundingClientRect();
    const triggerRect = triggerEl.getBoundingClientRect();
    const pad = 12;
    let shift = 0;
    if (rect.left < pad) {
      shift = pad - rect.left;
    } else if (rect.right > window.innerWidth - pad) {
      shift = window.innerWidth - pad - rect.right;
    }
    setNudgeX(Math.round(shift));

    const bottomSafe = window.innerHeight - 76;
    if (rect.bottom > bottomSafe && triggerRect.top > rect.height + 16) {
      setOpenUpward(true);
    } else {
      setOpenUpward(false);
    }
  }, [isOpen, align, wide]);

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
      ? 'bg-[#0057FF] text-white border-[#0057FF] shadow-xs ring-2 ring-[#0057FF]/20'
      : 'bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#0057FF] border-[#BFDBFE]',
    violet: isOpen
      ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-xs ring-2 ring-[#8B5CF6]/20'
      : 'bg-[#F5F3FF] hover:bg-[#EDE9FE] text-[#7C3AED] border-[#DDD6FE]',
    emerald: isOpen
      ? 'bg-[#059669] text-white border-[#059669] shadow-xs ring-2 ring-[#059669]/20'
      : 'bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#059669] border-[#A7F3D0]',
    amber: isOpen
      ? 'bg-[#D97706] text-white border-[#D97706] shadow-xs ring-2 ring-[#D97706]/20'
      : 'bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]',
    slate: isOpen
      ? 'bg-[#061138] text-white border-[#061138] shadow-xs ring-2 ring-[#061138]/15'
      : 'bg-[#F8FAFC] hover:bg-[#E2E8F0] text-[#475569] border-[#CBD5E1]',
    dark: isOpen
      ? 'bg-white text-[#061138] border-white shadow-xs ring-2 ring-white/30'
      : 'bg-white/10 hover:bg-white/20 text-white/90 border-white/20',
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
      className={`relative inline-flex items-center shrink-0 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        data-click-popover-trigger="true"
        aria-expanded={isOpen}
        aria-label={title}
        title={title}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={
          isMinimalIcon
            ? `inline-flex items-center justify-center w-6 h-6 rounded-full border transition-all cursor-pointer select-none ${toneClasses[tone]}`
            : `inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-extrabold transition-all cursor-pointer select-none ${toneClasses[tone]}`
        }
      >
        {iconType === 'help' ? (
          <HelpCircle className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <Info className="w-3.5 h-3.5 shrink-0" />
        )}
        {!isMinimalIcon ? <span>{resolvedLabel}</span> : null}
      </button>

      {isOpen ? (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label={title}
          style={nudgeX !== 0 ? { transform: `translateX(${nudgeX}px)` } : undefined}
          className={`absolute ${
            openUpward ? 'bottom-full mb-2' : 'top-full mt-2'
          } z-50 ${
            wide ? 'w-80 sm:w-96' : 'w-72 sm:w-80'
          } max-w-[calc(100vw-24px)] rounded-2xl bg-white border border-[#CBD5E1] shadow-[0_18px_45px_-12px_rgba(6,17,56,0.28)] p-3.5 text-right space-y-2 animate-in fade-in zoom-in-95 duration-150 ${alignClasses[align]}`}
        >
          <div className="flex items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-[#061138]">
              {iconType === 'help' ? (
                <HelpCircle className="w-3.5 h-3.5 text-[#0057FF] shrink-0" />
              ) : (
                <Info className="w-3.5 h-3.5 text-[#0057FF] shrink-0" />
              )}
              <span>{title}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="بستن راهنما"
              className="w-6 h-6 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] flex items-center justify-center cursor-pointer transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-[11px] sm:text-xs text-[#334155] leading-relaxed space-y-1.5 font-normal">
            {children}
          </div>
        </div>
      ) : null}
    </div>
  );
};
