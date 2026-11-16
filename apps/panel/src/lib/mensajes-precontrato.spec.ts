import { asuntoCorreoPrecontrato, mensajePrecontrato, textoAdelantosGuardados } from './mensajes-precontrato';

describe('mensajes del precontrato', () => {
  it('incluye el segundo adelanto y el enlace del documento', () => {
    const texto = mensajePrecontrato({
      nombreCompleto: 'Ana Ruiz',
      codigo: 'BM-1',
      montoTotal: 800,
      adelanto1Monto: 500,
      adelanto1Fecha: '2026-11-20',
      adelanto2Monto: 200,
      adelanto2Fecha: '2026-12-01',
      link: 'https://bosquemagico.gcbprojects.site/cotizacion/tok/precontrato',
    });

    expect(asuntoCorreoPrecontrato('BM-1')).toBe('Precontrato de reserva BM-1 - Bosque Mágico');
    expect(texto).toContain('Adelanto 1: S/ 500.00 · 20/11/2026');
    expect(texto).toContain('Adelanto 2: S/ 200.00 · 01/12/2026');
    expect(texto).toContain('No confirma el evento');
    expect(texto).toContain('/cotizacion/tok/precontrato');
    expect(texto).not.toContain('aceptar');
  });

  it('el aviso del detalle nombra los adelantos guardados', () => {
    expect(
      textoAdelantosGuardados({
        adelanto1Monto: 500,
        adelanto1Fecha: '2026-11-20',
      }),
    ).toBe('Adelanto de reserva guardado: S/ 500.00 · 20/11/2026. Al aceptar, el contrato lo toma.');
  });
});
