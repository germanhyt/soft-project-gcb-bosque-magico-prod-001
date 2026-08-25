import { OrigenItemCotizacion, TipoItemCotizacion } from '@prisma/client';
import type {
  ItemPaqueteResuelto,
  SeleccionPaqueteInput,
} from './composicion-paquete.types';

export type ReglasCapacidadInput = {
  cantidadNinos: number;
  maximoPermitido: number;
  /** Niños incluidos en el paquete (sin cargo). Antes ligado al show; ahora es capacidad del local. */
  ninosIncluidos: number;
  /** Costo por cada niño adicional fuera del rango incluido. */
  precioNinoExtra: number;
  seleccion: SeleccionPaqueteInput;
};

export type ResultadoCargosCapacidad = {
  montoTotal: number;
  items: ItemPaqueteResuelto[];
  itemsCobrables: Array<{ cantidad: number; precioUnitario: number }>;
};

/**
 * Cargos por capacidad del local (Refugio Gastronómico): niños adicionales.
 * Se cobra por cada niño que excede el rango incluido, haya o no show,
 * porque el costo marginal (comida + espacio + materiales) es del local.
 * Los extras (Pintacaritas, Uñitas, Hora loca, etc.) se cobran por 1 h de catálogo;
 * no se agrega línea por niño excedente.
 */
export function calcularCargosCapacidad(
  input: ReglasCapacidadInput,
): ResultadoCargosCapacidad {
  const ninos = Math.min(input.cantidadNinos, input.maximoPermitido);
  const items: ItemPaqueteResuelto[] = [];
  const itemsCobrables: Array<{ cantidad: number; precioUnitario: number }> =
    [];
  let montoTotal = 0;

  if (ninos > input.ninosIncluidos) {
    const cantidad = ninos - input.ninosIncluidos;
    const precio = input.precioNinoExtra;
    montoTotal += cantidad * precio;
    items.push({
      tipo: TipoItemCotizacion.show,
      nombre: 'Niños adicionales (Refugio Gastronómico)',
      cantidad,
      precioUnitario: precio,
      precioCatalogo: precio,
      origenItem: OrigenItemCotizacion.adicional,
      notas: `Del niño #${input.ninosIncluidos + 1} al #${input.maximoPermitido}`,
    });
    itemsCobrables.push({ cantidad, precioUnitario: precio });
  }

  return { montoTotal, items, itemsCobrables };
}
