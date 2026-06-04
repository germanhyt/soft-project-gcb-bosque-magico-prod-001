import type { ReactNode } from 'react';
import { Icon } from './Icon';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  loading?: boolean;
};

/** Modal amplio para ver y gestionar un registro sin salir del listado. */
export function DetalleModal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  loading,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detalle-modal-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-ambient"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-surface-variant px-5 py-4">
          <div className="min-w-0">
            <h2 id="detalle-modal-title" className="truncate text-title-md text-primary">
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
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-body-sm">
          {loading ? (
            <p className="py-8 text-center text-on-surface-variant">Cargando…</p>
          ) : (
            children
          )}
        </div>
        {footer && !loading && (
          <div className="shrink-0 border-t border-surface-variant px-5 py-4">{footer}</div>
        )}
      </div>
    </div>
  );
}
