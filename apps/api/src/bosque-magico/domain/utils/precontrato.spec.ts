import {
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
      terminosVersion: '2026-06',
      generadoEn: '2026-11-16T00:00:00.000Z',
    });
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
    expect(parsePrecontrato({ adelanto1Monto: 500 })).toBeNull();
    expect(parsePrecontrato(null)).toBeNull();
  });
});
