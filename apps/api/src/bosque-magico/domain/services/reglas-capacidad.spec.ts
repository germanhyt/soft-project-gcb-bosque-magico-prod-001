import { CategoriaProducto, SubtipoProducto } from '@prisma/client';
import {
  calcularCargosCapacidad,
  type ReglasCapacidadInput,
} from './reglas-capacidad';
import type { ProductoCotizacionRef } from './composicion-paquete.types';

const pinta: ProductoCotizacionRef = {
  id: 'ext-pinta',
  codigo: 'EXT-PINTA',
  nombre: 'Pintacaritas',
  categoria: CategoriaProducto.extra,
  subtipo: SubtipoProducto.general,
  precioLunesViernes: 190,
  precioFinSemana: 250,
  cantidadMinima: 1,
};

const unitas: ProductoCotizacionRef = {
  id: 'ext-unitas',
  codigo: 'EXT-UNITAS',
  nombre: 'Uñitas',
  categoria: CategoriaProducto.extra,
  subtipo: SubtipoProducto.general,
  precioLunesViernes: 190,
  precioFinSemana: 250,
  cantidadMinima: 1,
};

const horaLoca: ProductoCotizacionRef = {
  id: 'ext-hora',
  codigo: 'EXT-HORALOCA',
  nombre: 'Hora loca',
  categoria: CategoriaProducto.extra,
  subtipo: SubtipoProducto.general,
  precioLunesViernes: 190,
  precioFinSemana: 250,
  cantidadMinima: 1,
};

const baseInput = (
  overrides: Partial<ReglasCapacidadInput> = {},
): ReglasCapacidadInput => ({
  cantidadNinos: 25,
  maximoPermitido: 30,
  ninosIncluidosShow: 20,
  precioNinoExtraShow: 15,
  precioNinoExtraServicio: 10,
  seleccion: {},
  productos: new Map([[pinta.id, pinta]]),
  ...overrides,
});

describe('calcularCargosCapacidad', () => {
  it('no cobra extra de show sin show seleccionado', () => {
    const r = calcularCargosCapacidad(baseInput({ cantidadNinos: 25 }));
    expect(r.montoTotal).toBe(0);
    expect(r.items).toHaveLength(0);
  });

  it('cobra show extra del 21 al tope (5×15)', () => {
    const r = calcularCargosCapacidad(
      baseInput({
        cantidadNinos: 25,
        seleccion: { showIds: ['show-1'] },
      }),
    );
    expect(r.montoTotal).toBe(75);
    expect(r.items[0]?.cantidad).toBe(5);
    expect(r.items[0]?.precioUnitario).toBe(15);
  });

  it('cobra extra de servicio cuando supera límite incluido', () => {
    const r = calcularCargosCapacidad(
      baseInput({
        cantidadNinos: 25,
        seleccion: { extraIds: [pinta.id] },
      }),
    );
    expect(r.montoTotal).toBe(100);
    expect(r.items[0]?.nombre).toContain('Pintacaritas');
  });

  it('suma show extra y servicio extra', () => {
    const r = calcularCargosCapacidad(
      baseInput({
        cantidadNinos: 25,
        seleccion: { showIds: ['show-1'], extraIds: [pinta.id] },
      }),
    );
    expect(r.montoTotal).toBe(175);
  });

  it('limita cálculo al máximo permitido del evento', () => {
    const r = calcularCargosCapacidad(
      baseInput({
        cantidadNinos: 40,
        seleccion: { showIds: ['show-1'] },
      }),
    );
    expect(r.items[0]?.cantidad).toBe(10);
    expect(r.montoTotal).toBe(150);
  });

  it('usa rango configurable: incluidos +1 hasta maximo permitido', () => {
    const r = calcularCargosCapacidad(
      baseInput({
        cantidadNinos: 28,
        ninosIncluidosShow: 18,
        maximoPermitido: 28,
        seleccion: { showIds: ['show-1'] },
      }),
    );
    expect(r.items[0]?.cantidad).toBe(10);
    expect(r.items[0]?.notas).toBe('Del niño #19 al #28');
    expect(r.montoTotal).toBe(150);
  });

  it('cobra extra uñitas del 21 al tope (5×10)', () => {
    const r = calcularCargosCapacidad(
      baseInput({
        cantidadNinos: 25,
        productos: new Map([
          [pinta.id, pinta],
          [unitas.id, unitas],
        ]),
        seleccion: { extraIds: [unitas.id] },
      }),
    );
    expect(r.montoTotal).toBe(50);
    expect(r.items[0]?.cantidad).toBe(5);
    expect(r.items[0]?.precioUnitario).toBe(10);
  });

  it('no cobra extra pintacaritas con 15 niños (límite incluido)', () => {
    const r = calcularCargosCapacidad(
      baseInput({
        cantidadNinos: 15,
        seleccion: { extraIds: [pinta.id] },
      }),
    );
    expect(r.montoTotal).toBe(0);
  });

  it('cobra extra hora loca del 21 al tope (5×10)', () => {
    const r = calcularCargosCapacidad(
      baseInput({
        cantidadNinos: 25,
        productos: new Map([[horaLoca.id, horaLoca]]),
        seleccion: { extraIds: [horaLoca.id] },
      }),
    );
    expect(r.montoTotal).toBe(50);
    expect(r.items[0]?.cantidad).toBe(5);
  });
});
