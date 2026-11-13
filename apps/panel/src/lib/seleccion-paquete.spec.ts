/// <reference types="vitest/globals" />
import type { Producto } from './cotizaciones';
import { INITIAL_SELECCION_PAQUETE, seleccionToPayload } from './seleccion-paquete';

function producto(
  partial: Partial<Producto> & Pick<Producto, 'id' | 'codigo' | 'nombre'>,
): Producto {
  return {
    categoria: 'catering',
    subtipo: 'general',
    precioLunesViernes: 8,
    precioFinSemana: 8,
    cantidadMinima: 1,
    etapa: 'activo',
    ...partial,
  };
}

describe('seleccionToPayload catering adicional', () => {
  it('respeta una cantidad menor a 18 cuando el mínimo del producto es 1', () => {
    const popcorn = producto({
      id: 'popcorn',
      codigo: 'CAT-POPCORN-CAT',
      nombre: 'Popcorn (catering)',
      cantidadMinima: 1,
    });

    const payload = seleccionToPayload(
      {
        ...INITIAL_SELECCION_PAQUETE,
        adicionalIds: ['popcorn'],
        adicionalCantidades: { popcorn: 8 },
      },
      [popcorn],
    );

    expect(payload.adicionales).toEqual([{ productoId: 'popcorn', cantidad: 8 }]);
  });

  it('no baja de la cantidad mínima propia del producto', () => {
    const algodon = producto({
      id: 'algodon',
      codigo: 'CAT-ALGODON-CAT',
      nombre: 'Algodón de azúcar (catering)',
      cantidadMinima: 18,
    });

    const payload = seleccionToPayload(
      {
        ...INITIAL_SELECCION_PAQUETE,
        adicionalIds: ['algodon'],
        adicionalCantidades: { algodon: 8 },
      },
      [algodon],
    );

    expect(payload.adicionales).toEqual([{ productoId: 'algodon', cantidad: 18 }]);
  });
});
