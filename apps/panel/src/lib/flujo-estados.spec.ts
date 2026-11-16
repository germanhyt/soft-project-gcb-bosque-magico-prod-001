/// <reference types="vitest/globals" />
import {
  motivoBloqueoVolverABorradorCotizacion,
  puedeEntregarPrecontrato,
  puedeVolverABorradorCotizacion,
} from './flujo-estados';

describe('puedeEntregarPrecontrato', () => {
  it('está disponible en borrador y enviada', () => {
    expect(puedeEntregarPrecontrato('borrador')).toBe(true);
    expect(puedeEntregarPrecontrato('enviada')).toBe(true);
  });

  it('no aparece cuando la cotización ya entró al contrato', () => {
    expect(puedeEntregarPrecontrato('aceptada')).toBe(false);
    expect(puedeEntregarPrecontrato('cerrada')).toBe(false);
  });
});

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
