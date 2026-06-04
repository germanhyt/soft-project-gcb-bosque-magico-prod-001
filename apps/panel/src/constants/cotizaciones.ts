import type { EtapaCotizacion } from '../lib/cotizaciones';

export const ETAPA_COT_LABEL: Record<EtapaCotizacion, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  aceptada: 'Aceptada',
  cerrada: 'Cerrada',
};

export const ETAPA_COT_CLASS: Record<EtapaCotizacion, string> = {
  borrador: 'bg-neutral-200 text-neutral-800',
  enviada: 'bg-sky-100 text-sky-900',
  aceptada: 'bg-emerald-100 text-emerald-900',
  cerrada: 'bg-neutral-300 text-neutral-600',
};

export const ETAPAS_COT_FILTRO: { value: '' | EtapaCotizacion; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'borrador', label: 'Borrador' },
  { value: 'enviada', label: 'Enviada' },
  { value: 'aceptada', label: 'Aceptada' },
  { value: 'cerrada', label: 'Cerrada' },
];
