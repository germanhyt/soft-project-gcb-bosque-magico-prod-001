/// <reference types="vitest/globals" />
import {
  DURACION_TURNO_HORAS,
  etiquetaTurno,
  hayConflictoTurno,
  rangoTurnoPersonalizado,
  resolverHorarioTurno,
  solapanHorarios,
  sumarHoras,
  TURNO_PERSONALIZADO,
} from './turno-horario.js';

describe('turno personalizado 3h', () => {
  it('suma 3 horas al inicio', () => {
    expect(DURACION_TURNO_HORAS).toBe(3);
    expect(sumarHoras('16:00', 3)).toBe('19:00');
    expect(sumarHoras('9:30', 3)).toBe('12:30');
  });

  it('cruza medianoche', () => {
    expect(sumarHoras('22:00', 3)).toBe('01:00');
  });

  it('arma el rango de 3h desde la hora que elige el vendedor', () => {
    expect(rangoTurnoPersonalizado('11:00')).toEqual({
      inicio: '11:00',
      fin: '14:00',
    });
  });

  it('exige hora de inicio válida', () => {
    expect(rangoTurnoPersonalizado('')).toBeUndefined();
    expect(rangoTurnoPersonalizado('25:00')).toBeUndefined();
  });

  it('resuelve horario: personalizado usa inicio+3h; estándar deja el de config', () => {
    expect(
      resolverHorarioTurno(TURNO_PERSONALIZADO, '15:00'),
    ).toEqual({ inicio: '15:00', fin: '18:00' });
    expect(
      resolverHorarioTurno('turno_1', undefined, {
        inicio: '09:00',
        fin: '12:00',
      }),
    ).toEqual({ inicio: '09:00', fin: '12:00' });
  });

  it('etiqueta el turno personalizado con el rango', () => {
    expect(etiquetaTurno(TURNO_PERSONALIZADO, '15:00', '18:00')).toBe(
      'Turno personalizado (15:00–18:00)',
    );
    expect(etiquetaTurno('turno_2')).toBe('Turno 2');
  });

  it('detecta solape de rangos 3h', () => {
    expect(solapanHorarios('09:00', '12:00', '11:00', '14:00')).toBe(true);
    expect(solapanHorarios('09:00', '12:00', '14:00', '17:00')).toBe(false);
    expect(solapanHorarios('22:00', '01:00', '00:30', '03:30')).toBe(true);
  });

  it('conflicto de agenda: overlap por horas o mismo turno sin horas', () => {
    expect(
      hayConflictoTurno(
        { turno: TURNO_PERSONALIZADO, inicio: '11:00', fin: '14:00' },
        [{ turno: 'turno_1', inicio: '09:00', fin: '12:00' }],
      ),
    ).toBe(true);
    expect(
      hayConflictoTurno(
        { turno: TURNO_PERSONALIZADO, inicio: '15:00', fin: '18:00' },
        [{ turno: 'turno_1', inicio: '09:00', fin: '12:00' }],
      ),
    ).toBe(false);
    expect(
      hayConflictoTurno(
        { turno: 'turno_1' },
        [{ turno: 'turno_1' }],
      ),
    ).toBe(true);
    expect(
      hayConflictoTurno(
        { turno: TURNO_PERSONALIZADO, inicio: '11:00', fin: '14:00' },
        [{ turno: 'turno_1' }],
      ),
    ).toBe(true);
    expect(
      hayConflictoTurno(
        { turno: TURNO_PERSONALIZADO, inicio: '15:00', fin: '18:00' },
        [{ turno: 'turno_1' }],
      ),
    ).toBe(false);
  });
});
