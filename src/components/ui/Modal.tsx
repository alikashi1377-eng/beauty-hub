import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'md' | 'lg';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}) => {
  const pushedHistoryRef = useRef<boolean>(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') {
      if (
        pushedHistoryRef.current &&
        typeof window !== 'undefined' &&
        window.history.state?.timetoOverlay === 'modal'
      ) {
        pushedHistoryRef.current = false;
        try {
          window.history.back();
        } catch {
          // ignore
        }
      } else {
        pushedHistoryRef.current = false;
      }
      return;
    }

    try {
      window.history.pushState({ timetoOverlay: 'modal' }, '');
      pushedHistoryRef.current = true;
    } catch {
      // ignore
    }

    const handlePopState = () => {
      if (pushedHistoryRef.current) {
        pushedHistoryRef.current = false;
        onCloseRef.current();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#1E1B2E]/55 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`w-full ${
          size === 'lg' ? 'max-w-3xl' : 'max-w-lg'
        } max-h-[90vh] flex flex-col rounded-3xl bg-white border border-[#E6E0F5] shadow-[0_24px_60px_-15px_rgba(30,27,46,0.28)] overflow-hidden my-auto`}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#E6E0F5] bg-[#FAF8FF] shrink-0">
          <div className="min-w-0">
            <h2
              id="modal-title"
              className="text-sm sm:text-base font-bold text-[#1E1B2E] truncate"
            >
              {title}
            </h2>
            {description ? (
              <p className="text-xs font-normal text-[#6B6480] mt-0.5 line-clamp-1">
                {description}
              </p>
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
        <div className="p-4 sm:p-6 text-sm text-[#6B6480] overflow-y-auto flex-1">
          {children}
        </div>
        {footer ? (
          <div className="flex items-center justify-end gap-2 px-4 sm:px-6 py-3.5 bg-[#FAF8FF] border-t border-[#E6E0F5] shrink-0">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
};
