import {
  diaTieneCruceHorario,
  ocupantesParaCruce,
  textoChipCalendario,
} from './cruce-calendario';

describe('diaTieneCruceHorario', () => {
  it('marca cruce entre un evento y un borrador del mismo turno', () => {
    expect(
      diaTieneCruceHorario([
        { turno: 'turno_1', inicio: '09:00', fin: '12:00' },
        { turno: 'turno_1', inicio: '09:00', fin: '12:00' },
      ]),
    ).toBe(true);
  });

  it('marca cruce cuando el horario personalizado pisa un turno ocupado', () => {
    expect(
      diaTieneCruceHorario([
        { turno: 'turno_1', inicio: '09:00', fin: '12:00' },
        { turno: 'turno_personalizado', inicio: '11:00', fin: '14:00' },
      ]),
    ).toBe(true);
  });

  it('no marca cruce si los horarios no se pisan', () => {
    expect(
      diaTieneCruceHorario([
        { turno: 'turno_1', inicio: '09:00', fin: '12:00' },
        { turno: 'turno_2', inicio: '14:00', fin: '17:00' },
      ]),
    ).toBe(false);
  });

  it('un cancelado no se confunde con un borrador que ocupa el horario', () => {
    const slots = ocupantesParaCruce([
      { etapa: 'cancelado', turno: 'turno_1', inicio: '09:00', fin: '12:00' },
      { etapa: 'borrador', turno: 'turno_1', inicio: '09:00', fin: '12:00' },
    ]);
    expect(slots).toHaveLength(1);
    expect(diaTieneCruceHorario(slots)).toBe(false);
  });

  it('el chip muestra el estado junto al nombre', () => {
    expect(textoChipCalendario('Ana Ruiz', 'Borrador')).toBe('Ana · Borrador');
    expect(textoChipCalendario('Luis Paz', 'Cancelado')).toBe('Luis · Cancelado');
  });

  it('un solo ocupante no es cruce', () => {
    expect(
      diaTieneCruceHorario([{ turno: 'turno_1', inicio: '09:00', fin: '12:00' }]),
    ).toBe(false);
  });
});
