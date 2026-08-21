import {
  CategoriaProducto,
  ModoComposicionPaquete,
  OrigenItemCotizacion,
  SubtipoProducto,
  TipoItemCotizacion,
} from '@prisma/client';

export type ProductoCotizacionRef = {
  id: string;
  codigo: string;
  nombre: string;
  categoria: CategoriaProducto;
  subtipo: SubtipoProducto;
  precioLunesViernes: number;
  precioFinSemana: number;
  cantidadMinima: number;
};

export type ComposicionRegla = {
  modo: ModoComposicionPaquete;
  cantidad: number;
  montoCredito: number | null;
  componenteId: string | null;
  metadata: Record<string, unknown> | null;
};

export type ItemCantidadInput = {
  productoId: string;
  cantidad: number;
};

export type SeleccionPaqueteInput = {
  showIds?: string[];
  extraIds?: string[];
  snackId?: string;
  snackCantidad?: number;
  cajitasCantidad?: number;
  cajitasClasica?: number;
  cajitasSaludable?: number;
  piqueos?: ItemCantidadInput[];
  adicionales?: ItemCantidadInput[];
  /** Unidades de salita lounge (8 pax) cobrables. */
  salitaLoungeCantidad?: number;
  derechoIngresoShowExterno?: boolean;
  derechoIngresoDecoracionExterno?: boolean;
  derechoIngresoCarritoSnackExterno?: boolean;
};

export type ItemPaqueteResuelto = {
  productoId?: string;
  tipo: TipoItemCotizacion;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  precioCatalogo: number;
  origenItem: OrigenItemCotizacion;
  creditoAplicado?: number;
  notas?: string;
};

export type ResumenPaquete = {
  cajitasIncluidas: number;
  cajitasSolicitadas: number;
  cajitasExcedente: number;
  snackUnidadesIncluidas: number;
  snackUnidadesSolicitadas: number;
  snackUnidadesExcedente: number;
  snackMontoExcedente: number;
  piqueosCreditoIncluido: number;
  piqueosValorSeleccionado: number;
  piqueosExcedente: number;
};

export type ResultadoComposicionPaquete = {
  paqueteId: string;
  paqueteNombre: string;
  montoBasePaquete: number;
  items: ItemPaqueteResuelto[];
  itemsCobrables: Array<{ cantidad: number; precioUnitario: number }>;
  resumen: ResumenPaquete;
};

export function precioProducto(
  producto: ProductoCotizacionRef,
  esFinSemana: boolean,
): number {
  return esFinSemana ? producto.precioFinSemana : producto.precioLunesViernes;
}

/**
 * Precio efectivo de un producto según su categoría.
 * Catering (cajitas, snacks, piqueos, general): precio único, no varía por día.
 * Shows, extras, paquetes y espacios: mantienen tarifa L-V / S-D.
 */
export function precioProductoPorCategoria(
  producto: ProductoCotizacionRef,
  esFinSemana: boolean,
): number {
  if (producto.categoria === CategoriaProducto.catering) {
    return producto.precioLunesViernes;
  }
  return esFinSemana ? producto.precioFinSemana : producto.precioLunesViernes;
}

export function categoriaATipoItem(
  categoria: CategoriaProducto,
): TipoItemCotizacion {
  if (categoria === CategoriaProducto.catering) return TipoItemCotizacion.catering;
  if (categoria === CategoriaProducto.show) return TipoItemCotizacion.show;
  return TipoItemCotizacion.extra;
}

export function normalizarNombrePaquete(paquete: string): string {
  return paquete
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

export function coincidePaquete(
  productoNombre: string,
  paqueteInput: string,
): boolean {
  const a = normalizarNombrePaquete(productoNombre);
  const b = normalizarNombrePaquete(paqueteInput);
  return a === b || a.includes(b) || b.includes(a);
}
