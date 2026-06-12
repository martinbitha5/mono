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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-3 pt-3 sm:p-4"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#1D1E2C]/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog — panneau blanc, thème clair */}
      <div
        className={[
          'relative w-full flex flex-col bg-white',
          'rounded-2xl rounded-b-2xl',
          'max-h-[92dvh] sm:max-h-[88vh]',
          sizes[size],
        ].join(' ')}
        style={{
          border: '1px solid #E6E8F0',
          boxShadow: '0 24px 64px rgba(29,30,44,0.18), 0 4px 16px rgba(29,30,44,0.08)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-5 py-4 sm:px-6 sm:py-5 flex-shrink-0"
          style={{ borderBottom: '1px solid #EEF0F6' }}
        >
          <div>
            <h2 className="text-[15px] font-semibold text-zinc-900 leading-snug">
              {title}
            </h2>
            {description && (
              <p className="text-[13px] text-zinc-500 mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 flex-shrink-0 p-1.5 rounded-lg text-zinc-400
              hover:text-zinc-700 hover:bg-[#F4F5FA] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body — flex-1 + min-h-0 indispensables pour le scroll mobile */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6">
          {children}
        </div>

        {/* Optional footer */}
        {footer && (
          <div
            className="flex items-center justify-end gap-2 px-5 py-4 sm:px-6 flex-shrink-0"
            style={{ borderTop: '1px solid #EEF0F6', background: '#FAFBFE' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
