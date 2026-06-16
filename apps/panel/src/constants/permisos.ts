/** Permisos del panel — alineados con API (`auth/constants/permisos.ts`) y guard jerárquico. */

export const PERMISO_VIEW = 'bosque_magico:view' as const;
export const PERMISO_MANAGE = 'bosque_magico:manage' as const;
export const PERMISO_ADMIN = 'bosque_magico:admin' as const;

export type PermisoPanelId = typeof PERMISO_VIEW | typeof PERMISO_MANAGE | typeof PERMISO_ADMIN;

export type PermisoPanelDef = {
  id: PermisoPanelId;
  label: string;
  corto: string;
  descripcion: string;
  modulos: string[];
};

export const PERMISOS_PANEL: PermisoPanelDef[] = [
  {
    id: PERMISO_VIEW,
    label: 'Consulta',
    corto: 'Consulta',
    descripcion: 'Solo lectura en los módulos operativos del panel.',
    modulos: [
      'Dashboard',
      'Solicitudes',
      'Cotizaciones',
      'Clientes',
      'Agenda',
      'Operaciones',
      'Contratos',
      'Configuración (lectura)',
    ],
  },
  {
    id: PERMISO_MANAGE,
    label: 'Operación comercial',
    corto: 'Operación',
    descripcion: 'Consulta más crear, editar, enviar y confirmar en el flujo comercial.',
    modulos: [
      'Solicitudes y cotizaciones (alta/edición/envío)',
      'Agenda (confirmar, realizar, pedidos, checklist)',
      'Contratos (generar y enviar)',
      'Catálogo y proveedores',
    ],
  },
  {
    id: PERMISO_ADMIN,
    label: 'Administración',
    corto: 'Admin',
    descripcion: 'Tarifas, turnos, SMTP, feriados, usuarios y todo lo anterior.',
    modulos: [
      'Tarifas, turnos y feriados',
      'Usuarios del panel',
      'Configuración completa',
    ],
  },
];

/** Compatibilidad con formularios existentes. */
export const PERMISOS_DISPONIBLES = PERMISOS_PANEL.map((p) => ({
  id: p.id,
  label: `${p.label} — ${p.descripcion}`,
}));

const PERMISO_CORTO = Object.fromEntries(PERMISOS_PANEL.map((p) => [p.id, p.corto])) as Record<
  string,
  string
>;

/** Admin implica manage y view; manage implica view (igual que API). */
export function permisosEfectivos(permisos: string[]): Set<string> {
  const set = new Set(permisos);
  if (set.has(PERMISO_ADMIN)) {
    set.add(PERMISO_MANAGE);
    set.add(PERMISO_VIEW);
  } else if (set.has(PERMISO_MANAGE)) {
    set.add(PERMISO_VIEW);
  }
  return set;
}

export function etiquetaPermiso(id: string): string {
  return PERMISO_CORTO[id] ?? id;
}

export function permisoMasAlto(permisos: string[]): PermisoPanelId | null {
  const fx = permisosEfectivos(permisos);
  if (fx.has(PERMISO_ADMIN)) return PERMISO_ADMIN;
  if (fx.has(PERMISO_MANAGE)) return PERMISO_MANAGE;
  if (fx.has(PERMISO_VIEW)) return PERMISO_VIEW;
  return null;
}

/** Etiquetas para chips: rol más alto + permisos adicionales explícitos si aplica. */
export function etiquetasPermisoUsuario(permisos: string[]): string[] {
  const almacenados = [...new Set(permisos)];
  const fx = permisosEfectivos(almacenados);
  const orden: PermisoPanelId[] = [PERMISO_VIEW, PERMISO_MANAGE, PERMISO_ADMIN];
  return orden.filter((p) => fx.has(p)).map((p) => etiquetaPermiso(p));
}

export function togglePermisoPanel(prev: string[], id: PermisoPanelId): string[] {
  const set = new Set(prev);
  if (set.has(id)) {
    set.delete(id);
    if (id === PERMISO_VIEW) {
      set.delete(PERMISO_MANAGE);
      set.delete(PERMISO_ADMIN);
    } else if (id === PERMISO_MANAGE) {
      set.delete(PERMISO_ADMIN);
    }
  } else {
    set.add(id);
    if (id === PERMISO_ADMIN) {
      set.add(PERMISO_MANAGE);
      set.add(PERMISO_VIEW);
    } else if (id === PERMISO_MANAGE) {
      set.add(PERMISO_VIEW);
    }
  }
  return [...set];
}

export function usuarioCoincidePermisoFiltro(permisos: string[], filtro: PermisoPanelId): boolean {
  return permisosEfectivos(permisos).has(filtro);
}
