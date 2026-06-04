import { Icon } from './Icon';

type Props = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

export function DataTablePagination({
  page,
  totalPages,
  total,
  pageSize: _pageSize,
  onPageChange,
}: Props) {
  const pages = Math.max(1, totalPages);
  const registroLabel = total === 1 ? 'registro' : 'registros';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-surface-variant bg-surface-container-low/50 px-4 py-3 text-body-sm">
      <p className="text-on-surface-variant">
        Página {page} de {pages} ({total} {registroLabel})
      </p>
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
