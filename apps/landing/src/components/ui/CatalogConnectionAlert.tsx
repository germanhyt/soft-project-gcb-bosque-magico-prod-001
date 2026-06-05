import { BTN_SECONDARY } from '../../constants/design';
import { useConfiguracion } from '../../hooks/useConfiguracion';

export function CatalogConnectionAlert({ className = '' }: { className?: string }) {
  const { isError, isLoading, isFetching, failureCount, refetch } = useConfiguracion();

  if (isLoading || (isFetching && !isError)) return null;
  if (!isError) return null;

  return (
    <div
      role="alert"
      className={`rounded-xl border border-error/40 bg-error-container/30 px-4 py-3 text-sm text-on-surface ${className}`}
    >
      <p className="font-semibold text-error">No pudimos conectar con el servidor</p>
      <p className="mt-1 text-on-surface-variant">
        Shows, catering y extras no se pueden seleccionar hasta que el catálogo cargue. Si el
        problema continúa, escríbenos por WhatsApp.
      </p>
      <button
        type="button"
        className={`${BTN_SECONDARY} mt-3`}
        disabled={isFetching}
        onClick={() => void refetch()}
      >
        {isFetching ? 'Reintentando…' : `Reintentar${failureCount > 1 ? ` (${failureCount})` : ''}`}
      </button>
    </div>
  );
}
