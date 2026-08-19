import {
  OrigenItemCotizacion,
  TipoItemCotizacion,
} from '@prisma/client';
import type {
  ItemPaqueteResuelto,
  SeleccionPaqueteInput,
} from './composicion-paquete.types';

export type ReglasCapacidadInput = {
  cantidadNinos: number;
  maximoPermitido: number;
  ninosIncluidosShow: number;
  precioNinoExtraShow: number;
  seleccion: SeleccionPaqueteInput;
};

export type ResultadoCargosCapacidad = {
  montoTotal: number;
  items: ItemPaqueteResuelto[];
  itemsCobrables: Array<{ cantidad: number; precioUnitario: number }>;
};

/**
 * Cargos por capacidad: solo show (niños extra).
 * Los extras (Pintacaritas, Uñitas, Hora loca, etc.) se cobran por 1 h de catálogo;
 * no se agrega línea por niño excedente.
 */
export function calcularCargosCapacidad(
  input: ReglasCapacidadInput,
): ResultadoCargosCapacidad {
  const ninos = Math.min(input.cantidadNinos, input.maximoPermitido);
  const items: ItemPaqueteResuelto[] = [];
  const itemsCobrables: Array<{ cantidad: number; precioUnitario: number }> = [];
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

  return { montoTotal, items, itemsCobrables };
}
