import { CategoriaProducto, SubtipoProducto } from '@prisma/client';

export const PREFIJO_CODIGO_COTIZACION = 'COT-';
export const PREFIJO_NUMERO_CONTRATO = 'BM-CT-';
export const PADDING_CODIGO_DEFAULT = 5;
export const PADDING_CODIGO_PRODUCTO = 3;

export const PREFIJO_PRODUCTO_PAQUETE = 'PK-';
export const PREFIJO_PRODUCTO_SHOW = 'SHOW-';
export const PREFIJO_PRODUCTO_EXTRA = 'EXT-';
export const PREFIJO_PRODUCTO_ESPACIO = 'ESP-';
export const PREFIJO_PRODUCTO_CAJITA = 'CAJ-';
export const PREFIJO_PRODUCTO_CATERING = 'CAT-';
export const PREFIJO_PRODUCTO_PIQUEO = 'PIQ-';

/** Prefijos de catálogo con secuencia numérica (bootstrap en migración). */
export const PREFIJOS_SECUENCIA_CATALOGO = [
  PREFIJO_PRODUCTO_PAQUETE,
  PREFIJO_PRODUCTO_SHOW,
  PREFIJO_PRODUCTO_EXTRA,
  PREFIJO_PRODUCTO_ESPACIO,
  PREFIJO_PRODUCTO_CAJITA,
  PREFIJO_PRODUCTO_CATERING,
  PREFIJO_PRODUCTO_PIQUEO,
] as const;

export function prefijoCodigoProducto(
  categoria: CategoriaProducto,
  subtipo?: SubtipoProducto | null,
): string {
  switch (categoria) {
    case CategoriaProducto.paquete:
      return PREFIJO_PRODUCTO_PAQUETE;
    case CategoriaProducto.show:
      return PREFIJO_PRODUCTO_SHOW;
    case CategoriaProducto.extra:
      return PREFIJO_PRODUCTO_EXTRA;
    case CategoriaProducto.espacio:
      return PREFIJO_PRODUCTO_ESPACIO;
    case CategoriaProducto.catering:
      if (subtipo === SubtipoProducto.piqueo) return PREFIJO_PRODUCTO_PIQUEO;
      if (subtipo === SubtipoProducto.cajita) return PREFIJO_PRODUCTO_CAJITA;
      return PREFIJO_PRODUCTO_CATERING;
    default:
      return PREFIJO_PRODUCTO_CATERING;
  }
}
