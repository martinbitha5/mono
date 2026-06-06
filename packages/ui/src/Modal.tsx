import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open:         boolean;
  onClose:      () => void;
  title:        string;
  description?: string;
  children:     ReactNode;
  size?:        'sm' | 'md' | 'lg' | 'xl';
  footer?:      ReactNode;
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function Modal({
  open, onClose, title, description, children, size = 'md', footer,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4">
      {/* Backdrop sombre */}
      <div
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog — verre sombre, jamais blanc */}
      <div
        className={[
          'relative w-full flex flex-col',
          'rounded-2xl rounded-b-2xl',
          'max-h-[92dvh] sm:max-h-[88vh]',
          sizes[size],
        ].join(' ')}
        style={{
          background: 'rgba(10, 12, 20, 0.96)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.80), 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-5 py-4 sm:px-6 sm:py-5 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div>
            <h2 className="text-[15px] font-semibold text-zinc-50 leading-snug">
              {title}
            </h2>
            {description && (
              <p className="text-[13px] text-zinc-400 mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 flex-shrink-0 p-1.5 rounded-lg text-zinc-500
              hover:text-zinc-200 transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body — flex-1 + min-h-0 indispensables pour le scroll mobile */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6">
          {children}
        </div>

        {/* Optional footer */}
        {footer && (
          <div
            className="flex items-center justify-end gap-2 px-5 py-4 sm:px-6 flex-shrink-0"
            style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.25)' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
