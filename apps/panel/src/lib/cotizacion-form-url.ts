import type { CotizacionFormTarget } from '../components/cotizaciones/CotizacionFormModal';

export function cotizacionFormFromSearchParams(
  params: URLSearchParams,
): CotizacionFormTarget | null {
  const editar = params.get('editar');
  if (editar) return { mode: 'edit', cotizacionId: editar };
  if (params.get('form') === 'nueva') {
    const solicitudId = params.get('solicitudId') ?? undefined;
    return { mode: 'create', solicitudId: solicitudId || undefined };
  }
  return null;
}

export function clearCotizacionFormParams(params: URLSearchParams) {
  const next = new URLSearchParams(params);
  next.delete('editar');
  next.delete('form');
  next.delete('solicitudId');
  return next;
}
