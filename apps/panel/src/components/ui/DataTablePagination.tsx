import { PAGE_SIZE_OPTIONS, type PageSize } from '../../lib/pagination';
import { Icon } from './Icon';

type Props = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: PageSize) => void;
};

export function DataTablePagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: Props) {
  const pages = Math.max(1, totalPages);
  const registroLabel = total === 1 ? 'registro' : 'registros';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-surface-variant bg-surface-container-low/50 px-4 py-3 text-body-sm">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-on-surface-variant">
          Página {page} de {pages} ({total} {registroLabel})
        </p>
        {onPageSizeChange && (
          <label className="flex items-center gap-2 text-on-surface-variant">
            <span className="text-xs">Filas</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value) as PageSize)}
              className="h-9 rounded-lg border border-surface-variant bg-surface-container-lowest px-2 text-body-sm text-on-surface focus-visible:outline-2 focus-visible:outline-primary"
              aria-label="Filas por página"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-variant text-primary transition hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Página anterior"
        >
          <Icon name="chevron_left" size={22} filled={false} />
        </button>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-variant text-primary transition hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Página siguiente"
        >
          <Icon name="chevron_right" size={22} filled={false} />
        </button>
      </div>
    </div>
  );
}
