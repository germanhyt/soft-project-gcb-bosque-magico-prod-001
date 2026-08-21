import type { ItemCotizacion, Producto, SeleccionPaquetePayload } from './cotizaciones';
import { PAQUETES_CONFIG_DEFAULT } from './paquetes-config';
import {
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
  salitaLoungeCantidad: number;
  derechoIngresoShowExterno: boolean;
  derechoIngresoDecoracionExterno: boolean;
  derechoIngresoCarritoSnackExterno: boolean;
};

export const INITIAL_SELECCION_PAQUETE: SeleccionPaqueteState = {
  showIds: [],
  extraIds: [],
  extraCantidades: {},
  snackId: '',
  snackCantidad: 25,
  cajitasCantidad: CAJITAS_INCLUIDAS_DEFAULT,
  cajitasClasica: CAJITAS_INCLUIDAS_DEFAULT,
  cajitasSaludable: 0,
  piqueoIds: [],
  piqueosCantidades: {},
  adicionalIds: [],
  adicionalCantidades: {},
  salitaLoungeCantidad: 0,
  derechoIngresoShowExterno: false,
  derechoIngresoDecoracionExterno: false,
  derechoIngresoCarritoSnackExterno: false,
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
    snackCantidad: state.snackId ? Math.max(state.snackCantidad ?? 25, 25) : undefined,
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
    salitaLoungeCantidad: state.salitaLoungeCantidad > 0 ? state.salitaLoungeCantidad : undefined,
    derechoIngresoShowExterno: state.derechoIngresoShowExterno || undefined,
    derechoIngresoDecoracionExterno: state.derechoIngresoDecoracionExterno || undefined,
    derechoIngresoCarritoSnackExterno: state.derechoIngresoCarritoSnackExterno || undefined,
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
    snackCantidad: Math.max(sel.snackCantidad ?? 25, 25),
    cajitasCantidad: sel.cajitasCantidad ?? CAJITAS_INCLUIDAS_DEFAULT,
    cajitasClasica: sel.cajitasClasica ?? (sel.cajitasCantidad ?? CAJITAS_INCLUIDAS_DEFAULT),
    cajitasSaludable: sel.cajitasSaludable ?? 0,
    piqueoIds,
    piqueosCantidades,
    adicionalIds: sel.cateringIds ?? [],
    adicionalCantidades: { ...(sel.cateringCantidades ?? {}) },
    salitaLoungeCantidad: Math.max(sel.salitaLoungeCantidad ?? 0, 0),
    derechoIngresoShowExterno: Boolean(sel.derechoIngresoShowExterno),
    derechoIngresoDecoracionExterno: Boolean(sel.derechoIngresoDecoracionExterno),
    derechoIngresoCarritoSnackExterno: Boolean(sel.derechoIngresoCarritoSnackExterno),
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
  let snackId = '';
  let snackCantidad = 0;
  let cajitasCantidad = 0;
  let cajitasClasica = 0;
  let cajitasSaludable = 0;
  let salitaLoungeCantidad = 0;
  let derechoIngresoShowExterno = false;
  let derechoIngresoDecoracionExterno = false;
  let derechoIngresoCarritoSnackExterno = false;

  for (const item of items) {
    if (!item.productoId) {
      if (coincideNombreItem(item.nombre, NOMBRE_ITEM_SALITA_LOUNGE)) {
        salitaLoungeCantidad += item.cantidad;
      } else if (coincideNombreItem(item.nombre, NOMBRE_ITEM_INGRESO_SHOW_EXTERNO)) {
        derechoIngresoShowExterno = true;
      } else if (coincideNombreItem(item.nombre, NOMBRE_ITEM_INGRESO_DECORACION_EXTERNO)) {
        derechoIngresoDecoracionExterno = true;
      } else if (coincideNombreItem(item.nombre, NOMBRE_ITEM_INGRESO_CARRITO_SNACK_EXTERNO)) {
        derechoIngresoCarritoSnackExterno = true;
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
      continue;
    }
    if (p.categoria === 'extra') {
      if (!extraIds.includes(item.productoId)) extraIds.push(item.productoId);
      extraCantidades[item.productoId] = (extraCantidades[item.productoId] ?? 0) + item.cantidad;
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
    snackCantidad: Math.max(snackCantidad, 25),
    cajitasCantidad: cajitasCantidad || CAJITAS_INCLUIDAS_DEFAULT,
    cajitasClasica: cajitasCantidad > 0 ? cajitasClasica : CAJITAS_INCLUIDAS_DEFAULT,
    cajitasSaludable,
    piqueoIds,
    piqueosCantidades,
    adicionalIds,
    adicionalCantidades,
    salitaLoungeCantidad,
    derechoIngresoShowExterno,
    derechoIngresoDecoracionExterno,
    derechoIngresoCarritoSnackExterno,
  };
}

export function toggleIdEnLista(ids: string[], id: string, activo: boolean): string[] {
  if (activo) return ids.includes(id) ? ids : [...ids, id];
  return ids.filter((x) => x !== id);
}
