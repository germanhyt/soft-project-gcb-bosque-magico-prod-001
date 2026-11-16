import {
  adelantosExcedenTotal,
  armarPrecontrato,
  parsePrecontrato,
  puedeEntregarPrecontrato,
  resolverAdelantoPrecontrato,
} from './precontrato';

describe('precontrato', () => {
  it('se entrega en borrador y enviada, no cuando ya hay contrato', () => {
    expect(puedeEntregarPrecontrato('borrador')).toBe(true);
    expect(puedeEntregarPrecontrato('enviada')).toBe(true);
    expect(puedeEntregarPrecontrato('aceptada')).toBe(false);
    expect(puedeEntregarPrecontrato('cerrada')).toBe(false);
  });

  it('topa el adelanto al total cotizado', () => {
    expect(resolverAdelantoPrecontrato(800, 500)).toBe(500);
    expect(resolverAdelantoPrecontrato(300, 500)).toBe(300);
    expect(resolverAdelantoPrecontrato(800, 0)).toBe(0);
  });

  it('arma el registro con la versión de cláusulas vigente', () => {
    expect(
      armarPrecontrato({
        montoTotal: 300,
        adelanto1Monto: 500,
        adelanto1Fecha: '2026-11-20',
        generadoEn: '2026-11-16T00:00:00.000Z',
      }),
    ).toEqual({
      adelanto1Monto: 300,
      adelanto1Fecha: '2026-11-20',
      adelanto2Monto: 0,
      adelanto2Fecha: '',
      montoGarantia: 500,
      terminosVersion: '2026-06',
      generadoEn: '2026-11-16T00:00:00.000Z',
    });
  });

  it('guarda el segundo adelanto cuando la suma cabe en el total', () => {
    const guardado = armarPrecontrato({
      montoTotal: 800,
      adelanto1Monto: 500,
      adelanto1Fecha: '2026-11-20',
      adelanto2Monto: 200,
      adelanto2Fecha: '2026-12-01',
      montoGarantia: 300,
      generadoEn: '2026-11-16T00:00:00.000Z',
    });
    expect(guardado.adelanto2Monto).toBe(200);
    expect(guardado.adelanto2Fecha).toBe('2026-12-01');
    expect(guardado.montoGarantia).toBe(300);
    expect(adelantosExcedenTotal(800, 500, 200)).toBe(false);
    expect(adelantosExcedenTotal(800, 500, 400)).toBe(true);
  });

  it('lee un precontrato guardado y descarta uno incompleto', () => {
    expect(
      parsePrecontrato({
        adelanto1Monto: 500,
        adelanto1Fecha: '2026-11-20',
        terminosVersion: '2026-06',
        generadoEn: '2026-11-16T00:00:00.000Z',
      })?.adelanto1Monto,
    ).toBe(500);
    expect(
      parsePrecontrato({
        adelanto1Monto: 500,
        adelanto1Fecha: '2026-11-20',
      })?.adelanto2Monto,
    ).toBe(0);
    expect(
      parsePrecontrato({
        adelanto1Monto: 500,
        adelanto1Fecha: '2026-11-20',
        adelanto2Monto: 200,
        adelanto2Fecha: '2026-12-01',
      })?.adelanto2Monto,
    ).toBe(200);
    expect(parsePrecontrato({ adelanto1Monto: 500 })).toBeNull();
    expect(parsePrecontrato(null)).toBeNull();
  });
});
