import type { AreaPedido, EtapaPedido } from '../lib/pedidos';

export const AREA_PEDIDO_LABEL: Record<AreaPedido, string> = {
  ventas: 'Ventas',
  operaciones: 'Operaciones',
  decoracion: 'Decoración',
  catering: 'Catering',
  shows: 'Shows / proveedores',
  administracion: 'Administración',
};

export const ETAPA_PEDIDO_LABEL: Record<EtapaPedido, string> = {
  pendiente: 'Pendiente',
  solicitado: 'Solicitado',
  confirmado: 'Confirmado',
  en_proceso: 'En proceso',
  entregado: 'Entregado',
  cerrado: 'Cerrado',
  cancelado: 'Cancelado',
};

export const ETAPAS_PEDIDO_OPCIONES = (
  Object.entries(ETAPA_PEDIDO_LABEL) as [EtapaPedido, string][]
).map(([value, label]) => ({ value, label }));

export const AREAS_PEDIDO_OPCIONES = (
  Object.entries(AREA_PEDIDO_LABEL) as [AreaPedido, string][]
).map(([value, label]) => ({ value, label }));

export const ETAPA_PEDIDO_BADGE: Record<EtapaPedido, string> = {
  pendiente: 'bg-surface-container-high text-outline',
  solicitado: 'bg-secondary-container/40 text-secondary',
  confirmado: 'bg-primary-fixed/30 text-primary',
  en_proceso: 'bg-tertiary-fixed/40 text-on-surface',
  entregado: 'bg-primary-container/50 text-primary',
  cerrado: 'bg-surface-container-high text-outline',
  cancelado: 'bg-error-container/40 text-error',
};
