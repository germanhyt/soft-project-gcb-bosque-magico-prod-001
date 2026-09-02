import type { ItemCotizacion, Producto, SeleccionPaquetePayload } from './cotizaciones';
import { PAQUETES_CONFIG_DEFAULT } from './paquetes-config';
import {
  horariosConValor,
  parseHorarioDesdeNotas,
  type HorarioServicio,
  NOMBRE_ITEM_DERECHO_DECORACION_PERSONALIZADA,
  NOMBRE_ITEM_INGRESO_CARRITO_SNACK_EXTERNO,
  NOMBRE_ITEM_INGRESO_DECORACION_EXTERNO,
  NOMBRE_ITEM_INGRESO_SHOW_EXTERNO,
  NOMBRE_ITEM_SALITA_LOUNGE,
} from '@bosque/shared';

/** @deprecated Usar paquetesConfigDesdeItems() cuando haya config de API. */
export const CAJITAS_INCLUIDAS_DEFAULT = PAQUETES_CONFIG_DEFAULT.cajitasIncluidas;
/** @deprecated Usar paquetesConfigDesdeItems() cuando haya config de API. */
export const PIQUEOS_CREDITO_PREMIUM = PAQUETES_CONFIG_DEFAULT.piqueosCreditoPremium;

export type SeleccionPaqueteState = {
  showIds: string[];
  extraIds: string[];
  extraCantidades: Record<string, number>;
  snackId: string;
  snackCantidad: number;
  cajitasCantidad: number;
  cajitasClasica: number;
  cajitasSaludable: number;
  piqueoIds: string[];
  piqueosCantidades: Record<string, number>;
  adicionalIds: string[];
  adicionalCantidades: Record<string, number>;
  horarios: Record<string, HorarioServicio>;
  salitaLoungeCantidad: number;
  precioSalitaLounge?: number;
  derechoIngresoShowExterno: boolean;
  derechoIngresoDecoracionExterno: boolean;
  derechoIngresoCarritoSnackExterno: boolean;
  derechoDecoracionPersonalizada: boolean;
  precioDerechoIngresoShowExterno?: number;
  precioDerechoIngresoDecoracionExterno?: number;
  precioDerechoIngresoCarritoSnackExterno?: number;
  precioDerechoDecoracionPersonalizada?: number;
};

export const INITIAL_SELECCION_PAQUETE: SeleccionPaqueteState = {
  showIds: [],
  extraIds: [],
  extraCantidades: {},
  snackId: '',
  snackCantidad: 0,
  cajitasCantidad: 0,
  cajitasClasica: 0,
  cajitasSaludable: 0,
  piqueoIds: [],
  piqueosCantidades: {},
  adicionalIds: [],
  adicionalCantidades: {},
  horarios: {},
  salitaLoungeCantidad: 0,
  derechoIngresoShowExterno: false,
  derechoIngresoDecoracionExterno: false,
  derechoIngresoCarritoSnackExterno: false,
  derechoDecoracionPersonalizada: false,
};

export function normalizarPaqueteNombre(paquete: string): string {
  return paquete
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

export function esPaquetePremium(paquete: string): boolean {
  return normalizarPaqueteNombre(paquete).includes('premiu');
}

export function esPaquetePersonalizado(paquete: string): boolean {
  return normalizarPaqueteNombre(paquete).includes('personal');
}

export const CODIGO_SHOW_PERSONALIZADO = 'SHOW-001';

export function esShowPersonalizado(producto: Pick<Producto, 'codigo' | 'nombre'>): boolean {
  if (producto.codigo === CODIGO_SHOW_PERSONALIZADO) return true;
  return normalizarPaqueteNombre(producto.nombre).includes('personalizado');
}

export function esPaqueteEstandarOMayor(paquete: string): boolean {
  const n = normalizarPaqueteNombre(paquete);
  return n.includes('standar') || n.includes('estandar') || n.includes('premiu');
}

export function seleccionToPayload(
  state: SeleccionPaqueteState,
  productos?: Pick<Producto, 'id' | 'categoria' | 'subtipo' | 'cantidadMinima'>[],
): SeleccionPaquetePayload {
  const cajitasClasica = Math.max(state.cajitasClasica ?? 0, 0);
  const cajitasSaludable = Math.max(state.cajitasSaludable ?? 0, 0);
  const cajitasCantidad = Math.max(cajitasClasica + cajitasSaludable, state.cajitasCantidad);
  const minimoCatering = (id: string) => {
    const p = productos?.find((x) => x.id === id);
    if (p?.categoria === 'catering' && p.subtipo === 'general') {
      return Math.max(p.cantidadMinima, 18);
    }
    return Math.max(p?.cantidadMinima ?? 1, 1);
  };

  return {
    showIds: state.showIds.length ? state.showIds : undefined,
    extraIds: state.extraIds.length
      ? state.extraIds.flatMap((id) => {
        const qty = Math.max(state.extraCantidades[id] ?? 1, 1);
        return Array.from({ length: qty }, () => id);
      })
      : undefined,
    snackId: state.snackId || undefined,
    snackCantidad: state.snackId
      ? state.snackCantidad > 0
        ? state.snackCantidad
        : undefined
      : undefined,
    cajitasCantidad,
    cajitasClasica,
    cajitasSaludable,
    piqueos: state.piqueoIds.length
      ? state.piqueoIds.map((id) => ({
          productoId: id,
          cantidad: Math.max(state.piqueosCantidades[id] ?? 1, 1),
        }))
      : undefined,
    adicionales: state.adicionalIds.length
      ? state.adicionalIds.map((id) => {
          const min = minimoCatering(id);
          return {
            productoId: id,
            cantidad: Math.max(state.adicionalCantidades[id] ?? min, min),
          };
        })
      : undefined,
    horarios: horariosConValor(state.horarios),
    salitaLoungeCantidad: state.salitaLoungeCantidad > 0 ? state.salitaLoungeCantidad : undefined,
    precioSalitaLounge:
      typeof state.precioSalitaLounge === 'number' ? state.precioSalitaLounge : undefined,
    derechoIngresoShowExterno: state.derechoIngresoShowExterno || undefined,
    derechoIngresoDecoracionExterno: state.derechoIngresoDecoracionExterno || undefined,
    derechoIngresoCarritoSnackExterno: state.derechoIngresoCarritoSnackExterno || undefined,
    derechoDecoracionPersonalizada: state.derechoDecoracionPersonalizada || undefined,
    precioDerechoIngresoShowExterno:
      typeof state.precioDerechoIngresoShowExterno === 'number'
        ? state.precioDerechoIngresoShowExterno
        : undefined,
    precioDerechoIngresoDecoracionExterno:
      typeof state.precioDerechoIngresoDecoracionExterno === 'number'
        ? state.precioDerechoIngresoDecoracionExterno
        : undefined,
    precioDerechoIngresoCarritoSnackExterno:
      typeof state.precioDerechoIngresoCarritoSnackExterno === 'number'
        ? state.precioDerechoIngresoCarritoSnackExterno
        : undefined,
    precioDerechoDecoracionPersonalizada:
      typeof state.precioDerechoDecoracionPersonalizada === 'number'
        ? state.precioDerechoDecoracionPersonalizada
        : undefined,
  };
}

type PreferenciasSeleccion = {
  showIds?: string[];
  extraIds?: string[];
  snackId?: string;
  snackCantidad?: number;
  cajitasCantidad?: number;
  cajitasClasica?: number;
  cajitasSaludable?: number;
  piqueos?: Array<{ productoId: string; cantidad: number }>;
  cateringIds?: string[];
  cateringCantidades?: Record<string, number>;
  salitaLoungeCantidad?: number;
  derechoIngresoShowExterno?: boolean;
  derechoIngresoDecoracionExterno?: boolean;
  derechoIngresoCarritoSnackExterno?: boolean;
  derechoDecoracionPersonalizada?: boolean;
};

export function seleccionDesdePreferenciasLanding(
  sel?: PreferenciasSeleccion | null,
): SeleccionPaqueteState {
  if (!sel) return { ...INITIAL_SELECCION_PAQUETE };

  const piqueoIds = (sel.piqueos ?? []).map((p) => p.productoId);
  const piqueosCantidades: Record<string, number> = {};
  for (const p of sel.piqueos ?? []) {
    piqueosCantidades[p.productoId] = Math.max(p.cantidad, 1);
  }

  return {
    showIds: sel.showIds ?? [],
    extraIds: sel.extraIds ?? [],
    extraCantidades: { ...((sel as { extraCantidades?: Record<string, number> }).extraCantidades ?? {}) },
    snackId: sel.snackId ?? '',
    snackCantidad: sel.snackCantidad ?? 0,
    cajitasCantidad: sel.cajitasCantidad ?? 0,
    cajitasClasica: sel.cajitasClasica ?? sel.cajitasCantidad ?? 0,
    cajitasSaludable: sel.cajitasSaludable ?? 0,
    piqueoIds,
    piqueosCantidades,
    adicionalIds: sel.cateringIds ?? [],
    adicionalCantidades: { ...(sel.cateringCantidades ?? {}) },
    horarios: {},
    salitaLoungeCantidad: Math.max(sel.salitaLoungeCantidad ?? 0, 0),
    derechoIngresoShowExterno: Boolean(sel.derechoIngresoShowExterno),
    derechoIngresoDecoracionExterno: Boolean(sel.derechoIngresoDecoracionExterno),
    derechoIngresoCarritoSnackExterno: Boolean(sel.derechoIngresoCarritoSnackExterno),
    derechoDecoracionPersonalizada: Boolean(sel.derechoDecoracionPersonalizada),
  };
}

function coincideNombreItem(nombre: string, esperado: string) {
  return nombre.trim().toLowerCase() === esperado.toLowerCase();
}

export function seleccionDesdeItemsCotizacion(
  items: ItemCotizacion[],
  productos: Producto[],
): SeleccionPaqueteState {
  const byId = new Map(productos.map((p) => [p.id, p]));
  const showIds: string[] = [];
  const extraIds: string[] = [];
  const extraCantidades: Record<string, number> = {};
  const piqueoIds: string[] = [];
  const piqueosCantidades: Record<string, number> = {};
  const adicionalIds: string[] = [];
  const adicionalCantidades: Record<string, number> = {};
  const horarios: Record<string, HorarioServicio> = {};
  let snackId = '';
  let snackCantidad = 0;
  let cajitasCantidad = 0;
  let cajitasClasica = 0;
  let cajitasSaludable = 0;
  let salitaLoungeCantidad = 0;
  let precioSalitaLounge: number | undefined;
  let derechoIngresoShowExterno = false;
  let derechoIngresoDecoracionExterno = false;
  let derechoIngresoCarritoSnackExterno = false;
  let derechoDecoracionPersonalizada = false;
  let precioDerechoIngresoShowExterno: number | undefined;
  let precioDerechoIngresoDecoracionExterno: number | undefined;
  let precioDerechoIngresoCarritoSnackExterno: number | undefined;
  let precioDerechoDecoracionPersonalizada: number | undefined;

  for (const item of items) {
    if (!item.productoId) {
      if (coincideNombreItem(item.nombre, NOMBRE_ITEM_SALITA_LOUNGE)) {
        salitaLoungeCantidad += item.cantidad;
        precioSalitaLounge = item.precioUnitario;
      } else if (coincideNombreItem(item.nombre, NOMBRE_ITEM_INGRESO_SHOW_EXTERNO)) {
        derechoIngresoShowExterno = true;
        precioDerechoIngresoShowExterno = item.precioUnitario;
      } else if (coincideNombreItem(item.nombre, NOMBRE_ITEM_INGRESO_DECORACION_EXTERNO)) {
        derechoIngresoDecoracionExterno = true;
        precioDerechoIngresoDecoracionExterno = item.precioUnitario;
      } else if (coincideNombreItem(item.nombre, NOMBRE_ITEM_INGRESO_CARRITO_SNACK_EXTERNO)) {
        derechoIngresoCarritoSnackExterno = true;
        precioDerechoIngresoCarritoSnackExterno = item.precioUnitario;
      } else if (coincideNombreItem(item.nombre, NOMBRE_ITEM_DERECHO_DECORACION_PERSONALIZADA)) {
        derechoDecoracionPersonalizada = true;
        precioDerechoDecoracionPersonalizada = item.precioUnitario;
      }
      continue;
    }
    const p = byId.get(item.productoId);
    if (!p) continue;

    if (p.subtipo === 'cajita') {
      cajitasCantidad += item.cantidad;
      if (item.nombre.toLowerCase().includes('saludable')) {
        cajitasSaludable += item.cantidad;
      } else {
        cajitasClasica += item.cantidad;
      }
      continue;
    }
    if (p.subtipo === 'piqueo') {
      if (!piqueoIds.includes(item.productoId)) piqueoIds.push(item.productoId);
      piqueosCantidades[item.productoId] =
        (piqueosCantidades[item.productoId] ?? 0) + item.cantidad;
      continue;
    }
    if (p.subtipo === 'snack' && item.origenItem !== 'adicional') {
      snackId = item.productoId;
      snackCantidad += item.cantidad;
      continue;
    }
    if (p.categoria === 'show') {
      if (!showIds.includes(item.productoId)) showIds.push(item.productoId);
      const horario = parseHorarioDesdeNotas(item.notas);
      if (horario) horarios[item.productoId] = horario;
      continue;
    }
    if (p.categoria === 'extra') {
      if (!extraIds.includes(item.productoId)) extraIds.push(item.productoId);
      extraCantidades[item.productoId] = (extraCantidades[item.productoId] ?? 0) + item.cantidad;
      const horario = parseHorarioDesdeNotas(item.notas);
      if (horario) horarios[item.productoId] = horario;
      continue;
    }
    if (
      p.categoria === 'catering' &&
      (item.origenItem === 'adicional' || item.origenItem === 'manual')
    ) {
      if (!adicionalIds.includes(item.productoId)) adicionalIds.push(item.productoId);
      adicionalCantidades[item.productoId] = item.cantidad;
    }
  }

  return {
    showIds,
    extraIds,
    extraCantidades,
    snackId,
    snackCantidad,
    cajitasCantidad,
    cajitasClasica,
    cajitasSaludable,
    piqueoIds,
    piqueosCantidades,
    adicionalIds,
    adicionalCantidades,
    horarios,
    salitaLoungeCantidad,
    precioSalitaLounge,
    derechoIngresoShowExterno,
    derechoIngresoDecoracionExterno,
    derechoIngresoCarritoSnackExterno,
    derechoDecoracionPersonalizada,
    precioDerechoIngresoShowExterno,
    precioDerechoIngresoDecoracionExterno,
    precioDerechoIngresoCarritoSnackExterno,
    precioDerechoDecoracionPersonalizada,
  };
}

export function toggleIdEnLista(ids: string[], id: string, activo: boolean): string[] {
  if (activo) return ids.includes(id) ? ids : [...ids, id];
  return ids.filter((x) => x !== id);
}
