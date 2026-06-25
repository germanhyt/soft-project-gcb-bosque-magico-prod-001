import {
  fechaMinimaEvento,
  minDiasAnticipacionDesdeConfig,
  validarAnticipacionEvento,
} from './anticipacion-evento';
import { fechaCalendarioHoy } from './fecha-calendario';

describe('anticipacion-evento', () => {
  it('usa default 7 cuando el valor de config es inválido', () => {
    expect(minDiasAnticipacionDesdeConfig(undefined)).toBe(7);
    expect(minDiasAnticipacionDesdeConfig(-1)).toBe(7);
  });

  it('calcula fecha mínima sumando días desde hoy', () => {
    const min = fechaMinimaEvento(7);
    expect(min).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(min >= fechaCalendarioHoy()).toBe(true);
  });

  it('rechaza fechas antes del mínimo', () => {
    const hoy = fechaCalendarioHoy();
    expect(() => validarAnticipacionEvento(hoy, 7)).toThrow();
  });

  it('acepta fecha en el mínimo permitido', () => {
    const min = fechaMinimaEvento(3);
    expect(() => validarAnticipacionEvento(min, 3)).not.toThrow();
  });
});
