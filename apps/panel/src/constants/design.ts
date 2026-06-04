import type { EtapaCotizacion } from '../lib/cotizaciones';
import type { EtapaSolicitud } from '../lib/api';
import type { EtapaEvento } from '../lib/eventos';

export const INPUT_CLASS =
  'w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15';

export const LABEL_CLASS = 'text-label-caps text-outline block mb-1';

export const CARD_CLASS =
  'overflow-hidden rounded-xl border border-surface-variant bg-surface-container-lowest shadow-ambient';

export const TABLE_HEAD_CLASS =
  'sticky top-0 border-b border-surface-variant bg-surface/80 text-label-caps text-outline';

export const TABLE_ROW_CLASS =
  'border-b border-surface-variant/50 transition-colors hover:bg-surface-container-low';

export const TABLE_ROW_SELECTED = 'bg-surface-container-low';

/** Badges — CRM mockup */
export const ETAPA_BADGE: Record<EtapaSolicitud, string> = {
  nueva: 'bg-primary-fixed/50 text-primary',
  en_atencion: 'bg-secondary-fixed/60 text-secondary',
  cotizada: 'bg-tertiary-fixed text-tertiary',
  cerrada: 'bg-surface-variant text-on-surface-variant',
};

export const ETAPA_COT_BADGE: Record<EtapaCotizacion, string> = {
  borrador: 'bg-surface-variant text-on-surface-variant',
  enviada: 'bg-tertiary-fixed/70 text-tertiary',
  aceptada: 'bg-primary-fixed/60 text-primary',
  cerrada: 'bg-surface-container-high text-outline',
};

export const ETAPA_EVENTO_BADGE: Record<EtapaEvento, string> = {
  por_confirmar: 'bg-tertiary-fixed/70 text-tertiary',
  confirmado: 'bg-primary-fixed/50 text-primary',
  realizado: 'bg-secondary-fixed/50 text-secondary',
  cancelado: 'bg-surface-variant text-outline',
};

export const ETAPA_EVENTO_CARD: Record<EtapaEvento, string> = {
  por_confirmar: 'border-l-4 border-l-tertiary',
  confirmado: 'border-l-4 border-l-primary',
  realizado: 'border-l-4 border-l-secondary',
  cancelado: 'border-l-4 border-l-outline-variant opacity-75',
};

export const BADGE_BASE =
  'inline-flex rounded px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase';
