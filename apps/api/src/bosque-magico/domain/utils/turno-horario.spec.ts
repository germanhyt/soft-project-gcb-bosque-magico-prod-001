import {
  DURACION_TURNO_HORAS,
  hayConflictoTurno,
  rangoTurnoPersonalizado,
  TURNO_PERSONALIZADO,
} from './turno-horario';

describe('turno personalizado', () => {
  it('fija el rango a 3 horas', () => {
    expect(DURACION_TURNO_HORAS).toBe(3);
    expect(rangoTurnoPersonalizado('16:00')).toEqual({
      inicio: '16:00',
      fin: '19:00',
    });
  });

  it('detecta conflicto por overlap o mismo turno', () => {
    expect(
      hayConflictoTurno(
        { turno: TURNO_PERSONALIZADO, inicio: '11:00', fin: '14:00' },
        [{ turno: 'turno_1', inicio: '09:00', fin: '12:00' }],
      ),
    ).toBe(true);
    expect(
      hayConflictoTurno({ turno: 'turno_1' }, [{ turno: 'turno_1' }]),
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
