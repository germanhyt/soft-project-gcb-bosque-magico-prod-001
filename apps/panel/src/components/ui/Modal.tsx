import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';
import {
  MODAL_OVERLAY_CLASS,
  MODAL_PANEL_CLASS,
  MODAL_SCROLL_CLASS,
  useModalLayer,
} from './useModalLayer';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: 'md' | 'lg' | 'xl';
};

export function Modal({ open, onClose, title, description, children, size = 'md' }: Props) {
  useModalLayer(open);

  if (!open) return null;

  const maxW =
    size === 'xl' ? 'max-w-4xl' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg';

  return createPortal(
    <div
      className={MODAL_OVERLAY_CLASS}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        className={`${MODAL_PANEL_CLASS} ${maxW}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-surface-variant px-5 py-4">
          <div className="min-w-0">
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
            className="shrink-0 text-outline transition hover:text-on-surface"
            aria-label="Cerrar"
          >
            <Icon name="close" size={22} filled={false} />
          </button>
        </div>
        <div className={MODAL_SCROLL_CLASS}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
