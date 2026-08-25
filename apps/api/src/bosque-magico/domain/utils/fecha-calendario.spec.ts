import { formatFechaDdMmYyyy } from './fecha-calendario';

describe('formatFechaDdMmYyyy', () => {
  it('convierte YYYY-MM-DD a DD-MM-YYYY', () => {
    expect(formatFechaDdMmYyyy('2026-09-01')).toBe('01-09-2026');
  });

  it('toma solo la clave de un ISO', () => {
    expect(formatFechaDdMmYyyy('2026-09-01T12:00:00.000Z')).toBe('01-09-2026');
  });

  it('devuelve el original si no es una fecha calendario', () => {
    expect(formatFechaDdMmYyyy('invalid')).toBe('invalid');
  });
});
