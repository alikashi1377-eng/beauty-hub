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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#120F1D]/60 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white border border-[#E6E3EE] shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6E3EE] bg-[#FAF9FC]">
          <div>
            <h2
              id="modal-title"
              className="text-base font-extrabold text-[#120F1D]"
            >
              {title}
            </h2>
            {description ? (
              <p className="text-xs text-[#756F86] mt-0.5">{description}</p>
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
        <div className="p-6 text-sm text-[#4A4458]">{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-2 px-6 py-3.5 bg-[#F4F3F8] border-t border-[#E6E3EE]">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
};
