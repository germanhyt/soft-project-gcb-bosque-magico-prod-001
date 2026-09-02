import {
  anexarHorarioANotas,
  formatearHorarioServicio,
} from './horario-servicio';

describe('horario-servicio', () => {
  it('formatea rango, desde y hasta', () => {
    expect(formatearHorarioServicio({ inicio: '16:00', fin: '17:00' })).toBe(
      '16:00–17:00',
    );
    expect(formatearHorarioServicio({ inicio: '9:30' })).toBe('desde 09:30');
    expect(formatearHorarioServicio({ fin: '18:00' })).toBe('hasta 18:00');
  });

  it('anexa horario a notas sin duplicar', () => {
    expect(
      anexarHorarioANotas('Incluido en paquete', {
        inicio: '16:00',
        fin: '17:00',
      }),
    ).toBe('Incluido en paquete · Horario: 16:00–17:00');
    expect(
      anexarHorarioANotas('Incluido en paquete · Horario: 15:00–16:00', {
        inicio: '16:00',
        fin: '17:00',
      }),
    ).toBe('Incluido en paquete · Horario: 16:00–17:00');
  });
});
