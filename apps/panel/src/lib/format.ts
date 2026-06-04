export function formatFecha(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatMesDia(iso: string | null | undefined) {
  if (!iso) return { mes: '—', dia: '—' };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { mes: '—', dia: '—' };
  return {
    mes: d.toLocaleDateString('es-PE', { month: 'short' }).replace('.', '').toUpperCase(),
    dia: String(d.getDate()).padStart(2, '0'),
  };
}

export function formatFechaHora(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
