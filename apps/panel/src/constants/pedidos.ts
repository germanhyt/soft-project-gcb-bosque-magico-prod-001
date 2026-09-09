import type { AreaPedido, EtapaPedido } from '../lib/pedidos';

export const AREA_PEDIDO_LABEL: Record<AreaPedido, string> = {
  ventas: 'Ventas',
  operaciones: 'Operaciones',
  decoracion: 'Decoración',
  catering: 'Catering',
  shows: 'Shows / proveedores',
  administracion: 'Administración',
};

/** Flujo operativo simplificado (5 estados). */
export const ETAPA_PEDIDO_LABEL: Record<EtapaPedido, string> = {
  pendiente: 'Pendiente',
  solicitado: 'Solicitado',
  confirmado: 'Confirmado',
  entregado: 'Completado',
  cancelado: 'Cancelado',
};

export const ETAPAS_PEDIDO_OPCIONES = (
  Object.entries(ETAPA_PEDIDO_LABEL) as [EtapaPedido, string][]
).map(([value, label]) => ({ value, label }));

export const ETAPAS_PEDIDO_FILTRO: { value: '' | EtapaPedido; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  ...ETAPAS_PEDIDO_OPCIONES,
];

export const AREAS_PEDIDO_OPCIONES = (
  Object.entries(AREA_PEDIDO_LABEL) as [AreaPedido, string][]
).map(([value, label]) => ({ value, label }));

export const AREAS_PEDIDO_FILTRO: { value: '' | AreaPedido; label: string }[] = [
  { value: '', label: 'Todas las áreas' },
  ...AREAS_PEDIDO_OPCIONES,
];

export const ETAPA_PEDIDO_BADGE: Record<EtapaPedido, string> = {
  pendiente: 'bg-surface-variant text-on-surface-variant',
  solicitado: 'bg-tertiary-fixed/70 text-tertiary',
  confirmado: 'bg-primary-fixed/50 text-primary',
  entregado: 'bg-secondary-fixed/50 text-secondary',
  cancelado: 'bg-error-container/40 text-error',
};
