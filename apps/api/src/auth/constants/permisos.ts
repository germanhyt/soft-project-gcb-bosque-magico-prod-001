export const PERMISO_VIEW = 'bosque_magico:view';
export const PERMISO_MANAGE = 'bosque_magico:manage';
export const PERMISO_ADMIN = 'bosque_magico:admin';

export const PERMISOS_PANEL_COMPLETO = [
  PERMISO_VIEW,
  PERMISO_MANAGE,
  PERMISO_ADMIN,
] as const;

export type PermisoBosque = (typeof PERMISOS_PANEL_COMPLETO)[number];
