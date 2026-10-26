import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E1B2E]/55 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="w-full max-w-lg rounded-3xl bg-white border border-[#E6E0F5] shadow-[0_24px_60px_-15px_rgba(30,27,46,0.28)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6E0F5] bg-[#FAF8FF]">
          <div>
            <h2
              id="modal-title"
              className="text-base font-bold text-[#1E1B2E]"
            >
              {title}
            </h2>
            {description ? (
              <p className="text-xs font-normal text-[#6B6480] mt-0.5">{description}</p>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="بستن پنجره"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-6 text-sm text-[#6B6480]">{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-2 px-6 py-3.5 bg-[#FAF8FF] border-t border-[#E6E0F5]">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
};
