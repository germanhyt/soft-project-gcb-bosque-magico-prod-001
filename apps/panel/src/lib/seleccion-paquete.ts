import type { ItemCotizacion, Producto, SeleccionPaquetePayload } from './cotizaciones';
import { PAQUETES_CONFIG_DEFAULT } from './paquetes-config';

/** @deprecated Usar paquetesConfigDesdeItems() cuando haya config de API. */
export const CAJITAS_INCLUIDAS_DEFAULT = PAQUETES_CONFIG_DEFAULT.cajitasIncluidas;
/** @deprecated Usar paquetesConfigDesdeItems() cuando haya config de API. */
export const PIQUEOS_CREDITO_PREMIUM = PAQUETES_CONFIG_DEFAULT.piqueosCreditoPremium;

export type SeleccionPaqueteState = {
  showIds: string[];
  extraIds: string[];
  snackId: string;
  snackCantidad: number;
  cajitasCantidad: number;
  piqueoIds: string[];
  piqueosCantidades: Record<string, number>;
  adicionalIds: string[];
  adicionalCantidades: Record<string, number>;
};

export const INITIAL_SELECCION_PAQUETE: SeleccionPaqueteState = {
  showIds: [],
  extraIds: [],
  snackId: '',
  snackCantidad: 25,
  cajitasCantidad: CAJITAS_INCLUIDAS_DEFAULT,
  piqueoIds: [],
  piqueosCantidades: {},
  adicionalIds: [],
  adicionalCantidades: {},
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
  const minimoCatering = (id: string) => {
    const p = productos?.find((x) => x.id === id);
    if (p?.categoria === 'catering' && p.subtipo === 'general') {
      return Math.max(p.cantidadMinima, 18);
    }
    return Math.max(p?.cantidadMinima ?? 1, 1);
  };

  return {
    showIds: state.showIds.length ? state.showIds : undefined,
    extraIds: state.extraIds.length ? state.extraIds : undefined,
    snackId: state.snackId || undefined,
    snackCantidad: state.snackId ? Math.max(state.snackCantidad ?? 25, 25) : undefined,
    cajitasCantidad: state.cajitasCantidad,
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
  };
}

type PreferenciasSeleccion = {
  showIds?: string[];
  extraIds?: string[];
  snackId?: string;
  snackCantidad?: number;
  cajitasCantidad?: number;
  piqueos?: Array<{ productoId: string; cantidad: number }>;
  cateringIds?: string[];
  cateringCantidades?: Record<string, number>;
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
    snackId: sel.snackId ?? '',
    snackCantidad: Math.max(sel.snackCantidad ?? 25, 25),
    cajitasCantidad: sel.cajitasCantidad ?? CAJITAS_INCLUIDAS_DEFAULT,
    piqueoIds,
    piqueosCantidades,
    adicionalIds: sel.cateringIds ?? [],
    adicionalCantidades: { ...(sel.cateringCantidades ?? {}) },
  };
}

export function seleccionDesdeItemsCotizacion(
  items: ItemCotizacion[],
  productos: Producto[],
): SeleccionPaqueteState {
  const byId = new Map(productos.map((p) => [p.id, p]));
  const showIds: string[] = [];
  const extraIds: string[] = [];
  const piqueoIds: string[] = [];
  const piqueosCantidades: Record<string, number> = {};
  const adicionalIds: string[] = [];
  const adicionalCantidades: Record<string, number> = {};
  let snackId = '';
  let snackCantidad = 0;
  let cajitasCantidad = 0;

  for (const item of items) {
    if (!item.productoId) continue;
    const p = byId.get(item.productoId);
    if (!p) continue;

    if (p.subtipo === 'cajita') {
      cajitasCantidad += item.cantidad;
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
    snackId,
    snackCantidad: Math.max(snackCantidad, 25),
    cajitasCantidad: cajitasCantidad || CAJITAS_INCLUIDAS_DEFAULT,
    piqueoIds,
    piqueosCantidades,
    adicionalIds,
    adicionalCantidades,
  };
}

export function toggleIdEnLista(ids: string[], id: string, activo: boolean): string[] {
  if (activo) return ids.includes(id) ? ids : [...ids, id];
  return ids.filter((x) => x !== id);
}
