import { diaTieneCruceHorario } from './cruce-calendario';

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

  it('un solo ocupante no es cruce', () => {
    expect(
      diaTieneCruceHorario([{ turno: 'turno_1', inicio: '09:00', fin: '12:00' }]),
    ).toBe(false);
  });
});
