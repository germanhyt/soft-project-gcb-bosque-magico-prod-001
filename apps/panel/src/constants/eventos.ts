import type { EtapaEvento } from '../lib/eventos';

export { ETAPA_EVENTO_CARD } from './design';

export const ETAPA_EVENTO_LABEL: Record<EtapaEvento, string> = {
  por_confirmar: 'Por confirmar',
  confirmado: 'Confirmado',
  realizado: 'Realizado',
  cancelado: 'Cancelado',
};

export const ETAPAS_EVENTO_FILTRO: { value: '' | EtapaEvento; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'por_confirmar', label: 'Por confirmar' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'realizado', label: 'Realizado' },
  { value: 'cancelado', label: 'Cancelado' },
];

export const ETAPAS_EVENTO_RESUMEN_ORDEN: EtapaEvento[] = [
  'por_confirmar',
  'confirmado',
  'realizado',
  'cancelado',
];
