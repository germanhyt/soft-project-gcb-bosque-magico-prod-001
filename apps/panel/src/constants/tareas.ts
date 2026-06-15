import type { EtapaTareaEvento } from '../lib/tareas';

export const ETAPA_TAREA_LABEL: Record<EtapaTareaEvento, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  completado: 'Completado',
  bloqueado: 'Bloqueado',
};

export const ETAPAS_TAREA_OPCIONES = (
  Object.entries(ETAPA_TAREA_LABEL) as [EtapaTareaEvento, string][]
).map(([value, label]) => ({ value, label }));

export const ETAPA_TAREA_BADGE: Record<EtapaTareaEvento, string> = {
  pendiente: 'bg-surface-container-high text-outline',
  en_proceso: 'bg-secondary-container/40 text-secondary',
  completado: 'bg-primary-container/50 text-primary',
  bloqueado: 'bg-error-container/40 text-error',
};
