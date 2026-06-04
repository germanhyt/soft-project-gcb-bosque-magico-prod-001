import { useState, type ReactNode } from 'react';
import { CARD_CLASS } from '../../constants/design';
import { Icon } from './Icon';

type Props = {
  defaultOpen?: boolean;
  onRefresh?: () => void;
  children: ReactNode;
  className?: string;
};

/** Panel colapsable de filtros encima de la tabla (estilo CRM Sisa). */
export function TableFiltersPanel({
  defaultOpen = true,
  onRefresh,
  children,
  className = '',
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={`${CARD_CLASS} ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-surface-container-low/60"
        aria-expanded={open}
      >
        <span className="text-body-sm font-semibold text-on-surface">Filtros</span>
        <Icon name={open ? 'expand_less' : 'expand_more'} size={22} filled={false} className="text-outline" />
      </button>

      {open && (
        <div className="flex flex-wrap items-end gap-3 border-t border-surface-variant px-4 py-4">
          {children}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              title="Actualizar listado"
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-primary transition hover:border-primary/40 hover:bg-surface-container-low"
            >
              <Icon name="refresh" size={22} filled={false} />
            </button>
          )}
        </div>
      )}
    </section>
  );
}
