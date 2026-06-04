import type { ReactNode } from 'react';
import { Icon } from './Icon';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: 'md' | 'lg' | 'xl';
};

export function Modal({ open, onClose, title, description, children, size = 'md' }: Props) {
  if (!open) return null;

  const maxW =
    size === 'xl' ? 'max-w-4xl' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`max-h-[90vh] w-full ${maxW} overflow-y-auto rounded-xl bg-surface-container-lowest p-6 shadow-ambient`}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="modal-title" className="text-title-md text-primary">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-body-sm text-on-surface-variant">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-outline hover:text-on-surface"
            aria-label="Cerrar"
          >
            <Icon name="close" size={22} filled={false} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
