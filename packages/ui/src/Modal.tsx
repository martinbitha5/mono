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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop — subtle, Stripe-style */}
      <div
        className="absolute inset-0 bg-zinc-200/60 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Dialog — white card, Stripe shadow + border */}
      <div
        className={[
          'relative w-full flex flex-col max-h-[90vh] overflow-hidden',
          'bg-zinc-900 rounded-2xl',             /* zinc-900 = white */
          'border border-zinc-800',              /* zinc-800 = #E3EBF6 */
          'shadow-card-lg',
          sizes[size],
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-zinc-800 flex-shrink-0">
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
              hover:text-zinc-200 hover:bg-zinc-950 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto p-6">{children}</div>

        {/* Optional footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-6 py-4
            border-t border-zinc-800 flex-shrink-0 bg-zinc-950">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
