import {
  calcularCargosCapacidad,
  type ReglasCapacidadInput,
} from './reglas-capacidad';

const baseInput = (
  overrides: Partial<ReglasCapacidadInput> = {},
): ReglasCapacidadInput => ({
  cantidadNinos: 25,
  maximoPermitido: 35,
  ninosIncluidos: 25,
  precioNinoExtra: 25,
  seleccion: {},
  ...overrides,
});

describe('calcularCargosCapacidad', () => {
  it('no cobra extra dentro del rango incluido (25 niños)', () => {
    const r = calcularCargosCapacidad(baseInput({ cantidadNinos: 25 }));
    expect(r.montoTotal).toBe(0);
    expect(r.items).toHaveLength(0);
  });

  it('cobra niño adicional del 26 al tope haya o no show (3×25)', () => {
    const r = calcularCargosCapacidad(
      baseInput({ cantidadNinos: 28, seleccion: {} }),
    );
    expect(r.montoTotal).toBe(75);
    expect(r.items[0]?.cantidad).toBe(3);
    expect(r.items[0]?.precioUnitario).toBe(25);
  });

  it('cobra igual con o sin show (no depende del show)', () => {
    const sinShow = calcularCargosCapacidad(
      baseInput({ cantidadNinos: 28, seleccion: {} }),
    );
    const conShow = calcularCargosCapacidad(
      baseInput({ cantidadNinos: 28, seleccion: { showIds: ['show-1'] } }),
    );
    expect(sinShow.montoTotal).toBe(conShow.montoTotal);
    expect(conShow.montoTotal).toBe(75);
  });

  it('no cobra niño extra en servicios extra (precio de catálogo = 1 h)', () => {
    const r = calcularCargosCapacidad(
      baseInput({
        cantidadNinos: 28,
        seleccion: { extraIds: ['ext-pinta'] },
      }),
    );
    // Sigue cobrando solo el niño adicional del local, no línea por extra.
    expect(r.items).toHaveLength(1);
    expect(r.items[0]?.nombre).toBe('Niños adicionales (Refugio Gastronómico)');
    expect(r.montoTotal).toBe(75);
  });

  it('limita cálculo al máximo permitido del evento', () => {
    const r = calcularCargosCapacidad(
      baseInput({
        cantidadNinos: 40,
        seleccion: { showIds: ['show-1'] },
      }),
    );
    // 35 tope - 25 incluidos = 10 niños extra × 25 = 250
    expect(r.items[0]?.cantidad).toBe(10);
    expect(r.montoTotal).toBe(250);
  });

  it('usa rango configurable: incluidos +1 hasta maximo permitido', () => {
    const r = calcularCargosCapacidad(
      baseInput({
        cantidadNinos: 28,
        ninosIncluidos: 18,
        maximoPermitido: 28,
        seleccion: { showIds: ['show-1'] },
      }),
    );
    expect(r.items[0]?.cantidad).toBe(10);
    expect(r.items[0]?.notas).toBe('Del niño #19 al #28');
    expect(r.montoTotal).toBe(250);
  });
});
