export type QuoteBuilderSelection = {
  paquete: string;
  showIds: string[];
  showCantidades: Record<string, number>;
  extraIds: string[];
  extraCantidades: Record<string, number>;
  /** Popcorn o algodón (Premium) */
  snackId: string;
  /** Unidades solicitadas del carrito snack Premium (25 incluidas) */
  snackCantidad: number;
  /** Mínimo 10 incluidas en paquete */
  cajitasCantidad: number;
  cajitasClasica: number;
  cajitasSaludable: number;
  piqueoIds: string[];
  piqueosCantidades: Record<string, number>;
  /** Catering genérico adicional (fuera de piqueos/cajitas) */
  cateringIds: string[];
  cateringCantidades: Record<string, number>;
};

import { PAQUETES_CONFIG_DEFAULT } from '../lib/paquetes-config';

export const CAJITAS_INCLUIDAS_DEFAULT = PAQUETES_CONFIG_DEFAULT.cajitasIncluidas;
/** @deprecated Usar paquetesConfigDesdeItems() desde config API. */
export const PIQUEOS_CREDITO_PREMIUM = PAQUETES_CONFIG_DEFAULT.piqueosCreditoPremium;

export const INITIAL_QUOTE_SELECTION: QuoteBuilderSelection = {
  paquete: '',
  showIds: [],
  showCantidades: {},
  extraIds: [],
  extraCantidades: {},
  snackId: '',
  snackCantidad: 0,
  cajitasCantidad: 0,
  cajitasClasica: 0,
  cajitasSaludable: 0,
  piqueoIds: [],
  piqueosCantidades: {},
  cateringIds: [],
  cateringCantidades: {},
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

export function esShowPersonalizado(producto: { codigo?: string; nombre: string }): boolean {
  if (producto.codigo === CODIGO_SHOW_PERSONALIZADO) return true;
  return normalizarPaqueteNombre(producto.nombre).includes('personalizado');
}

export function esPaqueteEstandarOMayor(paquete: string): boolean {
  const n = normalizarPaqueteNombre(paquete);
  return n.includes('standar') || n.includes('estandar') || n.includes('premiu');
}
