export function unidadProductoNormalizada(unidad?: string | null): string {
  return (unidad ?? '').trim().toLowerCase();
}

export function esUnidadPorHora(unidad?: string | null): boolean {
  const u = unidadProductoNormalizada(unidad);
  return u === 'hora' || u === 'horas' || u === '1h' || u === '1 h';
}

export function esExtraBloque(unidad?: string | null): boolean {
  const u = unidadProductoNormalizada(unidad);
  return Boolean(u) && !esUnidadPorHora(unidad);
}

export function etiquetaPrecioPorUnidad(unidad?: string | null): string {
  const raw = (unidad ?? '').trim();
  if (!raw || esUnidadPorHora(raw)) return 'por hora';
  return `por ${raw}`;
}

export function etiquetaCantidadExtra(unidad?: string | null): string {
  if (esExtraBloque(unidad)) return (unidad ?? '').trim() || 'bloque';
  return 'Horas';
}
