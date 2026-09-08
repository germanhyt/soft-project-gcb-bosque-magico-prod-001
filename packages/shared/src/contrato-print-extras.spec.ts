/// <reference types="vitest/globals" />
import {
  buildContratoPrintHtml,
  buildCotizacionPrintHtml,
  CONTRATO_EXTRAS_PERMITIDOS_INTRO,
  type ContratoPrintPayload,
} from './index';

const form = {
  numeroDocumento: '12345678',
  tipoComprobante: 'boleta' as const,
  documentoTributario: 'DNI',
  horarioInicio: '15:00',
  horarioFin: '18:00',
  adelanto1Monto: 500,
  adelanto1Fecha: '2026-09-10',
  adelanto2Monto: 1270,
  adelanto2Fecha: '2026-09-19',
  montoGarantia: 500,
};

function contratoPayload(
  extras?: string[] | null,
  comentario?: string | null,
): ContratoPrintPayload {
  return {
    fechaEmision: '2026-09-08',
    cotizacion: {
      codigo: 'COT-001',
      fechaEvento: '2026-09-20',
      turno: 'turno_1',
      cantidadNinos: 20,
      paquete: 'Premium',
      montoBase: 1770,
      montoNinosExtra: 0,
      montoItems: 0,
      montoTotal: 1770,
      cliente: { nombreCompleto: 'Ana Pérez', celular: '999111222' },
      cumpleanero: { nombre: 'Leo', edad: 6 },
      extrasPermitidos: extras,
      extrasPermitidosComentario: comentario,
    },
    form,
  };
}

const printOpts = { logoUrl: '/logo.png' };

describe('impresion extras permitidos', () => {
  it('imprime el texto formal en el contrato', () => {
    const html = buildContratoPrintHtml(contratoPayload(['Piñata']), printOpts);

    expect(html).toContain('Extras permitidos');
    expect(html).toContain(CONTRATO_EXTRAS_PERMITIDOS_INTRO);
    expect(html).not.toContain(
      'Permitidos sin cobro automático por Bosque Mágico',
    );
    expect(html).toContain('<li>Piñata</li>');
  });

  it('en contratos antiguos (sin snapshot) lista Piñata y Torta temática', () => {
    const html = buildContratoPrintHtml(contratoPayload(null), printOpts);

    expect(html).toContain('<li>Piñata</li>');
    expect(html).toContain('<li>Torta temática</li>');
  });

  it('lista vacía se imprime como ninguno acordado', () => {
    const html = buildContratoPrintHtml(contratoPayload([]), printOpts);

    expect(html).toContain('Ninguno acordado');
    expect(html).not.toContain('<li>Piñata</li>');
  });

  it('incluye la observación del vendedor', () => {
    const html = buildContratoPrintHtml(
      contratoPayload(['Torta temática'], 'Entrega 30 minutos antes'),
      printOpts,
    );

    expect(html).toContain('Entrega 30 minutos antes');
  });

  it('no incluye extras permitidos en el PDF de cotización', () => {
    const html = buildCotizacionPrintHtml(
      {
        codigo: 'COT-001',
        etapa: 'enviada',
        fechaEvento: '2026-09-20',
        turno: 'turno_1',
        cantidadNinos: 20,
        paquete: 'Premium',
        montoBase: 1770,
        montoNinosExtra: 0,
        montoItems: 0,
        montoTotal: 1770,
        cliente: { nombreCompleto: 'Ana Pérez', celular: '999111222' },
        cumpleanero: { nombre: 'Leo', edad: 6 },
        items: [],
      },
      printOpts,
    );

    expect(html).not.toContain('Extras permitidos');
    expect(html).not.toContain(CONTRATO_EXTRAS_PERMITIDOS_INTRO);
  });
});
