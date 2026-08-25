import {
  CategoriaProducto,
  ModoComposicionPaquete,
  OrigenItemCotizacion,
  SubtipoProducto,
} from '@prisma/client';
import { resolverComposicionPaquete } from './composicion-paquete.resolver';
import type { ProductoCotizacionRef } from './composicion-paquete.types';

const mk = (
  partial: Partial<ProductoCotizacionRef> &
    Pick<ProductoCotizacionRef, 'id' | 'codigo' | 'nombre' | 'categoria'>,
): ProductoCotizacionRef => ({
  subtipo: SubtipoProducto.general,
  precioLunesViernes: 0,
  precioFinSemana: 0,
  cantidadMinima: 1,
  ...partial,
});

describe('resolverComposicionPaquete', () => {
  const paquetePremium = mk({
    id: 'pkg-premium',
    codigo: 'PK-PREMIUM',
    nombre: 'Premium',
    categoria: CategoriaProducto.paquete,
    precioLunesViernes: 1770,
    precioFinSemana: 2100,
  });

  const productos = new Map<string, ProductoCotizacionRef>([
    [paquetePremium.id, paquetePremium],
    [
      'cajita',
      mk({
        id: 'cajita',
        codigo: 'CAJ-BOSQUE',
        nombre: 'Cajita Bosque Mágico',
        categoria: CategoriaProducto.catering,
        subtipo: SubtipoProducto.cajita,
        precioLunesViernes: 20.9,
        precioFinSemana: 20.9,
      }),
    ],
    [
      'show1',
      mk({
        id: 'show1',
        codigo: 'SHOW-MAGIA',
        nombre: 'Magia',
        categoria: CategoriaProducto.show,
        precioLunesViernes: 180,
        precioFinSemana: 220,
      }),
    ],
    [
      'show2',
      mk({
        id: 'show2',
        codigo: 'SHOW-MIMO',
        nombre: 'Mimo',
        categoria: CategoriaProducto.show,
        precioLunesViernes: 200,
        precioFinSemana: 240,
      }),
    ],
    [
      'extra1',
      mk({
        id: 'extra1',
        codigo: 'EXT-PINTA',
        nombre: 'Pintacaritas',
        categoria: CategoriaProducto.extra,
        precioLunesViernes: 120,
        precioFinSemana: 150,
      }),
    ],
    [
      'piq1',
      mk({
        id: 'piq1',
        codigo: 'PIQ-001',
        nombre: 'Causitas',
        categoria: CategoriaProducto.catering,
        subtipo: SubtipoProducto.piqueo,
        precioLunesViernes: 50,
        precioFinSemana: 50,
      }),
    ],
    [
      'piq2',
      mk({
        id: 'piq2',
        codigo: 'PIQ-002',
        nombre: 'Butifarras',
        categoria: CategoriaProducto.catering,
        subtipo: SubtipoProducto.piqueo,
        precioLunesViernes: 112.5,
        precioFinSemana: 112.5,
      }),
    ],
    [
      'piq3',
      mk({
        id: 'piq3',
        codigo: 'PIQ-020',
        nombre: 'Tequeños',
        categoria: CategoriaProducto.catering,
        subtipo: SubtipoProducto.piqueo,
        precioLunesViernes: 62.5,
        precioFinSemana: 62.5,
      }),
    ],
    [
      'snack1',
      mk({
        id: 'snack1',
        codigo: 'CAT-POPCORN',
        nombre: 'Popcorn',
        categoria: CategoriaProducto.catering,
        subtipo: SubtipoProducto.snack,
        precioLunesViernes: 350,
        precioFinSemana: 350,
      }),
    ],
  ]);

  const reglasPremium = [
    {
      modo: ModoComposicionPaquete.slot_show,
      cantidad: 1,
      montoCredito: null,
      componenteId: null,
      metadata: null,
    },
    {
      modo: ModoComposicionPaquete.slot_extra,
      cantidad: 1,
      montoCredito: null,
      componenteId: null,
      metadata: null,
    },
    {
      modo: ModoComposicionPaquete.cajitas_incluidas,
      cantidad: 10,
      montoCredito: null,
      componenteId: null,
      metadata: null,
    },
    {
      modo: ModoComposicionPaquete.eleccion_snack,
      cantidad: 1,
      montoCredito: null,
      componenteId: null,
      metadata: {
        productoIds: ['snack1'],
        unidadesIncluidas: 25,
        precioPack: 350,
        precioUnidadExcedente: 10,
      },
    },
    {
      modo: ModoComposicionPaquete.credito_piqueos,
      cantidad: 1,
      montoCredito: 200,
      componenteId: null,
      metadata: null,
    },
  ];

  it('incluye 10 cajitas sin cargo y cobra excedente a S/ 20.90', () => {
    const r = resolverComposicionPaquete({
      paquete: paquetePremium,
      reglas: reglasPremium,
      productos,
      seleccion: { cajitasCantidad: 15 },
      esFinSemana: false,
    });

    const incluidas = r.items.find(
      (i) =>
        i.origenItem === OrigenItemCotizacion.incluido_paquete &&
        i.nombre.includes('Cajita'),
    );
    const excedente = r.items.find(
      (i) => i.origenItem === OrigenItemCotizacion.excedente_paquete,
    );

    expect(incluidas?.cantidad).toBe(10);
    expect(incluidas?.precioUnitario).toBe(0);
    expect(excedente?.cantidad).toBe(5);
    expect(excedente?.precioUnitario).toBe(20.9);
    expect(r.resumen.cajitasExcedente).toBe(5);
    expect(r.itemsCobrables).toEqual([{ cantidad: 5, precioUnitario: 20.9 }]);
  });

  it('primer show incluido y segundo show a precio completo', () => {
    const r = resolverComposicionPaquete({
      paquete: paquetePremium,
      reglas: reglasPremium,
      productos,
      seleccion: { showIds: ['show1', 'show2'] },
      esFinSemana: false,
    });

    const shows = r.items.filter((i) => i.tipo === 'show');
    expect(shows[0].precioUnitario).toBe(0);
    expect(shows[1].precioUnitario).toBe(200);
    expect(r.montoBasePaquete).toBe(1770);
  });

  it('aplica crédito S/200 acumulado y solo cobra el excedente final', () => {
    const r = resolverComposicionPaquete({
      paquete: paquetePremium,
      reglas: reglasPremium,
      productos,
      seleccion: {
        piqueos: [
          { productoId: 'piq1', cantidad: 1 },
          { productoId: 'piq2', cantidad: 1 },
          { productoId: 'piq3', cantidad: 1 },
        ],
      },
      esFinSemana: false,
    });

    expect(r.resumen.piqueosValorSeleccionado).toBe(225);
    expect(r.resumen.piqueosExcedente).toBe(25);
    const cobrablesPiqueos = r.items.filter(
      (i) =>
        i.origenItem === OrigenItemCotizacion.excedente_paquete &&
        i.nombre === 'Tequeños',
    );
    expect(cobrablesPiqueos).toHaveLength(1);
    expect(cobrablesPiqueos[0].precioUnitario).toBe(25);
    expect(cobrablesPiqueos[0].creditoAplicado).toBe(37.5);
  });

  it('cobra 2 packs del mismo piqueo aplicando crédito pack a pack', () => {
    const r = resolverComposicionPaquete({
      paquete: paquetePremium,
      reglas: reglasPremium,
      productos,
      seleccion: {
        piqueos: [{ productoId: 'piq1', cantidad: 2 }],
      },
      esFinSemana: false,
    });

    const causitas = r.items.filter((i) => i.nombre === 'Causitas');
    expect(causitas).toHaveLength(2);
    expect(causitas[0].precioUnitario).toBe(0);
    expect(causitas[0].creditoAplicado).toBe(50);
    expect(causitas[1].precioUnitario).toBe(0);
    expect(causitas[1].creditoAplicado).toBe(50);
    expect(r.resumen.piqueosExcedente).toBe(0);
  });

  it('cuando el crédito se agota parcialmente, solo cobra la diferencia pendiente', () => {
    const r = resolverComposicionPaquete({
      paquete: paquetePremium,
      reglas: reglasPremium,
      productos,
      seleccion: {
        piqueos: [
          { productoId: 'piq2', cantidad: 1 },
          { productoId: 'piq1', cantidad: 2 },
        ],
      },
      esFinSemana: false,
    });

    expect(r.resumen.piqueosValorSeleccionado).toBe(112.5 + 50 + 50);
    expect(r.resumen.piqueosExcedente).toBe(12.5);
  });

  it('snack Premium incluye 25 unidades y cobra excedente por unidad', () => {
    const r = resolverComposicionPaquete({
      paquete: paquetePremium,
      reglas: reglasPremium,
      productos,
      seleccion: {
        snackId: 'snack1',
        snackCantidad: 30,
      },
      esFinSemana: false,
    });

    const snackIncluido = r.items.find(
      (i) =>
        i.nombre === 'Popcorn' &&
        i.origenItem === OrigenItemCotizacion.incluido_paquete,
    );
    const snackExcedente = r.items.find(
      (i) =>
        i.nombre === 'Popcorn' &&
        i.origenItem === OrigenItemCotizacion.excedente_paquete,
    );
    expect(snackIncluido?.cantidad).toBe(25);
    expect(snackIncluido?.precioCatalogo).toBe(350);
    expect(snackExcedente?.cantidad).toBe(5);
    expect(snackExcedente?.precioUnitario).toBe(10);
    expect(r.resumen.snackUnidadesExcedente).toBe(5);
    expect(r.resumen.snackMontoExcedente).toBe(50);
  });

  it('prioriza configuración pública para excedente snack sobre metadata de regla', () => {
    const r = resolverComposicionPaquete({
      paquete: paquetePremium,
      reglas: reglasPremium,
      productos,
      seleccion: {
        snackId: 'snack1',
        snackCantidad: 32,
      },
      esFinSemana: false,
      snackPremiumUnidadesIncluidas: 30,
      snackPremiumPrecioExcedente: 12,
    });

    const snackIncluido = r.items.find(
      (i) =>
        i.nombre === 'Popcorn' &&
        i.origenItem === OrigenItemCotizacion.incluido_paquete,
    );
    const snackExcedente = r.items.find(
      (i) =>
        i.nombre === 'Popcorn' &&
        i.origenItem === OrigenItemCotizacion.excedente_paquete,
    );
    expect(snackIncluido?.cantidad).toBe(30);
    expect(snackExcedente?.cantidad).toBe(2);
    expect(snackExcedente?.precioUnitario).toBe(12);
    expect(r.resumen.snackUnidadesExcedente).toBe(2);
    expect(r.resumen.snackMontoExcedente).toBe(24);
  });

  it('prioriza configuración pública para crédito de piqueos sobre montoCredito de regla', () => {
    const r = resolverComposicionPaquete({
      paquete: paquetePremium,
      reglas: reglasPremium,
      productos,
      seleccion: {
        piqueos: [{ productoId: 'piq1', cantidad: 3 }],
      },
      esFinSemana: false,
      piqueosCreditoPremium: 100,
    });

    expect(r.resumen.piqueosCreditoIncluido).toBe(100);
    expect(r.resumen.piqueosValorSeleccionado).toBe(150);
    expect(r.resumen.piqueosExcedente).toBe(50);
  });
});
