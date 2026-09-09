/// <reference types="vitest/globals" />
import {
  motivoBloqueoVolverABorradorCotizacion,
  puedeVolverABorradorCotizacion,
} from './flujo-estados';

describe('puedeVolverABorradorCotizacion', () => {
  it('permite enviada', () => {
    expect(puedeVolverABorradorCotizacion('enviada')).toBe(true);
  });

  it('permite aceptada por defecto', () => {
    expect(
      puedeVolverABorradorCotizacion('aceptada', {
        eventoEtapa: 'por_confirmar',
      }),
    ).toBe(true);
  });

  it('bloquea aceptada si la config está off', () => {
    expect(
      puedeVolverABorradorCotizacion('aceptada', { permitirAceptada: false }),
    ).toBe(false);
  });

  it('bloquea si el evento está confirmado', () => {
    expect(
      puedeVolverABorradorCotizacion('aceptada', { eventoEtapa: 'confirmado' }),
    ).toBe(false);
    expect(
      motivoBloqueoVolverABorradorCotizacion('aceptada', {
        eventoEtapa: 'confirmado',
      }),
    ).toMatch(/confirmado/);
  });

  it('bloquea si el contrato está firmado', () => {
    expect(
      puedeVolverABorradorCotizacion('aceptada', {
        eventoEtapa: 'por_confirmar',
        contratoEtapa: 'firmado',
      }),
    ).toBe(false);
  });
});
