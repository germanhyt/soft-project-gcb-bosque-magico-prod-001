import {
  mensajeCapacidadMaximo,
  mensajeCapacidadMinimo,
  ninosMaximoDesdeConfig,
  ninosMinimoDesdeConfig,
  NINOS_MAXIMO_PERMITIDO_DEFAULT,
  NINOS_MINIMO_DEFAULT,
  validarCapacidadEvento,
} from './capacidad-evento';

describe('capacidad-evento', () => {
  it('usa defaults cuando el valor de config es inválido', () => {
    expect(ninosMinimoDesdeConfig(undefined)).toBe(NINOS_MINIMO_DEFAULT);
    expect(ninosMaximoDesdeConfig(-1)).toBe(NINOS_MAXIMO_PERMITIDO_DEFAULT);
  });

  it('acepta cantidad dentro del rango', () => {
    expect(() => validarCapacidadEvento(25, 10, 35)).not.toThrow();
  });

  it('omite validación si no hay cantidad', () => {
    expect(() => validarCapacidadEvento(undefined, 10, 35)).not.toThrow();
  });

  it('rechaza por debajo del mínimo en español', () => {
    expect(() => validarCapacidadEvento(5, 10, 35)).toThrow(
      mensajeCapacidadMinimo(10),
    );
  });

  it('rechaza por encima del máximo en español', () => {
    expect(() => validarCapacidadEvento(40, 10, 35)).toThrow(
      mensajeCapacidadMaximo(35),
    );
  });
});
