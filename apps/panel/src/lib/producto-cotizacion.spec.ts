/// <reference types="vitest/globals" />
import type { Producto } from './cotizaciones';
import { productosParaCotizacion } from './producto-cotizacion';

function producto(partial: Partial<Producto> & Pick<Producto, 'id' | 'codigo' | 'nombre'>): Producto {
  return {
    categoria: 'extra',
    precioLunesViernes: 0,
    precioFinSemana: 0,
    cantidadMinima: 1,
    etapa: 'activo',
    ...partial,
  };
}

describe('productosParaCotizacion', () => {
  const catalogo = [
    producto({
      id: 'pinta',
      codigo: 'EXT-PINTA',
      nombre: 'Pintacaritas',
      precioLunesViernes: 120,
      precioFinSemana: 150,
    }),
    producto({
      id: 'pinata',
      codigo: 'EXT-PINATA',
      nombre: 'Piñata',
    }),
    producto({
      id: 'torta',
      codigo: 'EXT-TORTA',
      nombre: 'Torta temática',
      extraPermitido: true,
    }),
    producto({
      id: 'globo',
      codigo: 'EXT-GLOBO',
      nombre: 'Globo permitido',
      extraPermitido: true,
    }),
  ];

  it('separa extras cobrables de extras permitidos del contrato', () => {
    const grupos = productosParaCotizacion(catalogo);

    expect(grupos.extras.map((p) => p.codigo)).toEqual(['EXT-PINTA']);
    expect(grupos.extrasPermitidos.map((p) => p.codigo)).toEqual([
      'EXT-PINATA',
      'EXT-TORTA',
      'EXT-GLOBO',
    ]);
  });

  it('reconoce Piñata/Torta por código si el flag no viene en el JSON', () => {
    const grupos = productosParaCotizacion([
      producto({ id: 'pinata', codigo: 'EXT-PINATA', nombre: 'Piñata' }),
    ]);

    expect(grupos.extras).toEqual([]);
    expect(grupos.extrasPermitidos).toHaveLength(1);
  });
});
