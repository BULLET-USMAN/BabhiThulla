import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-charcoal-950/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex min-h-full items-center justify-center p-4 pointer-events-none">
        <div
          ref={modalRef}
          className={`w-full ${maxWidthClasses[maxWidth]} bg-charcoal-850 border border-gold-500/30 rounded-2xl shadow-2xl overflow-hidden transition-all transform animate-scale-up pointer-events-auto`}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-charcoal-700/80 bg-charcoal-900/60">
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-gold-300 font-display">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-gray-400 mt-0.5">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-charcoal-700/60 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 text-cream-100">{children}</div>
        </div>
      </div>
    </div>
  );
}
