import { useSocketStatus } from '../../contexts/SocketStatusContext';

export function LiveStatusBadge() {
  const { status } = useSocketStatus();

  if (status === 'connected') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-fixed/40 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary" aria-hidden />
        En vivo
      </span>
    );
  }

  if (status === 'connecting') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-variant bg-surface-container-low px-3 py-1 text-xs font-semibold text-outline">
        <span className="h-2 w-2 rounded-full bg-tertiary animate-pulse" aria-hidden />
        Conectando…
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-variant bg-surface-container-low px-3 py-1 text-xs font-semibold text-outline">
      <span className="h-2 w-2 rounded-full bg-outline" aria-hidden />
      Sin conexión
    </span>
  );
}
