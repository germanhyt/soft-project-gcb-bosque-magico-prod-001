/// <reference types="vitest/globals" />
import {
  formatFechaCalendarioCorta,
  formatFechaCalendarioLarga,
} from './fecha-formato.js';

describe('fecha de calendario en documentos', () => {
  it('un ISO a medianoche UTC no atrasa un día respecto de la fecha cotizada', () => {
    const isoUtc = '2026-09-20T00:00:00.000Z';
    expect(formatFechaCalendarioLarga(isoUtc)).toMatch(/^20 de /);
    expect(formatFechaCalendarioLarga(isoUtc)).toContain('2026');
    expect(formatFechaCalendarioLarga(isoUtc)).not.toMatch(/^19 de /);
    expect(formatFechaCalendarioCorta(isoUtc)).toBe('20/09/2026');
  });

  it('YYYY-MM-DD coincide con el mismo día', () => {
    expect(formatFechaCalendarioLarga('2026-09-20')).toMatch(/^20 de /);
    expect(formatFechaCalendarioCorta('2026-09-20')).toBe('20/09/2026');
  });
});
