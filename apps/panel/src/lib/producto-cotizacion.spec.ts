/// <reference types="vitest/globals" />
import type { Producto } from './cotizaciones';
import { cantidadItemProducto, productosParaCotizacion } from './producto-cotizacion';

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

  it('separa catering adicional de piqueos, cajitas y snacks', () => {
    const grupos = productosParaCotizacion([
      producto({
        id: 'gelatina',
        codigo: 'CAT-GEL',
        nombre: 'Gelatina',
        categoria: 'catering',
        subtipo: 'general',
        cantidadMinima: 18,
      }),
      producto({
        id: 'piqueo',
        codigo: 'CAT-PIQ',
        nombre: 'Mini hamburguesa',
        categoria: 'catering',
        subtipo: 'piqueo',
      }),
      producto({
        id: 'cajita',
        codigo: 'CAT-CAJ',
        nombre: 'Cajita clásica',
        categoria: 'catering',
        subtipo: 'cajita',
      }),
      producto({
        id: 'snack',
        codigo: 'CAT-SNK',
        nombre: 'Snack premium',
        categoria: 'catering',
        subtipo: 'snack',
      }),
      producto({
        id: 'inactivo',
        codigo: 'CAT-OLD',
        nombre: 'Catering inactivo',
        categoria: 'catering',
        subtipo: 'general',
        etapa: 'inactivo',
      }),
    ]);

    expect(grupos.catering.map((p) => p.codigo)).toEqual(['CAT-GEL']);
    expect(grupos.piqueos.map((p) => p.codigo)).toEqual(['CAT-PIQ']);
    expect(grupos.cajitas.map((p) => p.codigo)).toEqual(['CAT-CAJ']);
    expect(grupos.snacks.map((p) => p.codigo)).toEqual(['CAT-SNK']);
  });
});

describe('cantidadItemProducto', () => {
  it('usa el mínimo del catering adicional cuando no hay cantidad guardada', () => {
    const catering = producto({
      id: 'gelatina',
      codigo: 'CAT-GEL',
      nombre: 'Gelatina',
      categoria: 'catering',
      subtipo: 'general',
      cantidadMinima: 18,
    });

    expect(cantidadItemProducto(catering, {})).toBe(18);
    expect(cantidadItemProducto(catering, { gelatina: 24 })).toBe(24);
  });
});
