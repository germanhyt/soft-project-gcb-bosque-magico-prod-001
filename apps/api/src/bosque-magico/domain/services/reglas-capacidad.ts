import {
  OrigenItemCotizacion,
  TipoItemCotizacion,
} from '@prisma/client';
import type {
  ItemPaqueteResuelto,
  ProductoCotizacionRef,
  SeleccionPaqueteInput,
} from './composicion-paquete.types';

/** Niños incluidos sin cargo extra por servicio adicional (Grupo B). */
export const EXTRAS_LIMITE_NINOS_POR_CODIGO: Record<string, number> = {
  'EXT-PINTA': 15,
  'EXT-UNITAS': 20,
  'EXT-HORALOCA': 20,
};

export type ReglasCapacidadInput = {
  cantidadNinos: number;
  maximoPermitido: number;
  ninosIncluidosShow: number;
  precioNinoExtraShow: number;
  precioNinoExtraServicio: number;
  seleccion: SeleccionPaqueteInput;
  productos: Map<string, ProductoCotizacionRef>;
};

export type ResultadoCargosCapacidad = {
  montoTotal: number;
  items: ItemPaqueteResuelto[];
  itemsCobrables: Array<{ cantidad: number; precioUnitario: number }>;
};

export function calcularCargosCapacidad(
  input: ReglasCapacidadInput,
): ResultadoCargosCapacidad {
  const ninos = Math.min(input.cantidadNinos, input.maximoPermitido);
  const items: ItemPaqueteResuelto[] = [];
  const itemsCobrables: Array<{ cantidad: number; precioUnitario: number }> =
    [];
  let montoTotal = 0;

  const tieneShow = (input.seleccion.showIds?.length ?? 0) > 0;
  if (tieneShow && ninos > input.ninosIncluidosShow) {
    const cantidad = ninos - input.ninosIncluidosShow;
    const precio = input.precioNinoExtraShow;
    montoTotal += cantidad * precio;
    items.push({
      tipo: TipoItemCotizacion.show,
      nombre: 'Niños adicionales show',
      cantidad,
      precioUnitario: precio,
      precioCatalogo: precio,
      origenItem: OrigenItemCotizacion.adicional,
      notas: `Del niño #${input.ninosIncluidosShow + 1} al #${input.maximoPermitido}`,
    });
    itemsCobrables.push({ cantidad, precioUnitario: precio });
  }

  for (const extraId of input.seleccion.extraIds ?? []) {
    const producto = input.productos.get(extraId);
    if (!producto) continue;
    const limite = EXTRAS_LIMITE_NINOS_POR_CODIGO[producto.codigo];
    if (limite == null || ninos <= limite) continue;

    const cantidad = ninos - limite;
    const precio = input.precioNinoExtraServicio;
    montoTotal += cantidad * precio;
    items.push({
      productoId: producto.id,
      tipo: TipoItemCotizacion.extra,
      nombre: `Niños adicionales — ${producto.nombre}`,
      cantidad,
      precioUnitario: precio,
      precioCatalogo: precio,
      origenItem: OrigenItemCotizacion.excedente_paquete,
      notas: `Máx. ${limite} incluidos; excedente por niño`,
    });
    itemsCobrables.push({ cantidad, precioUnitario: precio });
  }

  return { montoTotal, items, itemsCobrables };
}
