/// <reference types="vitest/globals" />
import { buildContratoPrintHtml, type ContratoPrintPayload } from './contrato-print.js';
import { buildCotizacionPrintHtml, type CotizacionPrintData } from './cotizacion-print.js';

const printOpts = { logoUrl: '/logo.png' };

const cotBase: CotizacionPrintData = {
  codigo: 'COT-001',
  etapa: 'enviada',
  fechaEvento: '2026-09-20',
  turno: 'turno_personalizado',
  horarioInicio: '11:00',
  horarioFin: '14:00',
  cantidadNinos: 20,
  paquete: 'Estándar',
  montoBase: 1500,
  montoNinosExtra: 0,
  montoItems: 520,
  montoTotal: 2020,
  cliente: { nombreCompleto: 'Ana Pérez', celular: '999111222' },
  cumpleanero: { nombre: 'Leo', edad: 6 },
  items: [
    {
      nombre: 'Magia Chispeante',
      cantidad: 1,
      precioUnitario: 520,
      subtotal: 520,
      origenItem: 'adicional',
      notas: 'Horario: 12:00–12:45',
    },
  ],
};

describe('impresión horarios show y turno personalizado', () => {
  it('en la cotización muestra el rango del turno personalizado y el horario del show', () => {
    const html = buildCotizacionPrintHtml(cotBase, printOpts);

    expect(html).toContain('Turno personalizado (11:00–14:00)');
    expect(html).toContain('Horario: 12:00–12:45');
    expect(html).toContain('Magia Chispeante');
  });

  it('en el contrato lista el horario del show junto al nombre', () => {
    const payload: ContratoPrintPayload = {
      fechaEmision: '2026-09-08',
      cotizacion: {
        codigo: cotBase.codigo,
        fechaEvento: cotBase.fechaEvento,
        turno: 'turno_personalizado',
        cantidadNinos: cotBase.cantidadNinos,
        paquete: cotBase.paquete,
        montoBase: cotBase.montoBase,
        montoNinosExtra: cotBase.montoNinosExtra,
        montoItems: cotBase.montoItems,
        montoTotal: cotBase.montoTotal,
        cliente: cotBase.cliente,
        cumpleanero: cotBase.cumpleanero,
        items: [
          {
            id: 'i1',
            tipo: 'show',
            nombre: 'Magia Chispeante',
            cantidad: 1,
            precioUnitario: 520,
            subtotal: 520,
            origenItem: 'adicional',
            notas: 'Horario: 12:00–12:45',
          },
        ],
      },
      form: {
        numeroDocumento: '12345678',
        tipoComprobante: 'boleta',
        documentoTributario: 'DNI',
        horarioInicio: '11:00',
        horarioFin: '14:00',
        adelanto1Monto: 500,
        adelanto1Fecha: '2026-09-10',
        adelanto2Monto: 0,
        adelanto2Fecha: '',
        montoGarantia: 500,
      },
    };

    const html = buildContratoPrintHtml(payload, printOpts);
    expect(html).toContain('Magia Chispeante');
    expect(html).toContain('Horario: 12:00–12:45');
    expect(html).toContain('11:00');
    expect(html).toContain('14:00');
  });

  it('la fecha cotizada no se atrasa un día si llega como ISO UTC a medianoche', () => {
    const isoUtc = '2026-09-20T00:00:00.000Z';
    const cotHtml = buildCotizacionPrintHtml(
      { ...cotBase, fechaEvento: isoUtc },
      printOpts,
    );
    expect(cotHtml).toMatch(/20 de /);
    expect(cotHtml).not.toMatch(/19 de /);

    const contratoHtml = buildContratoPrintHtml(
      {
        fechaEmision: isoUtc,
        cotizacion: {
          codigo: cotBase.codigo,
          fechaEvento: isoUtc,
          turno: 'turno_1',
          cantidadNinos: cotBase.cantidadNinos,
          paquete: cotBase.paquete,
          montoBase: cotBase.montoBase,
          montoNinosExtra: cotBase.montoNinosExtra,
          montoItems: cotBase.montoItems,
          montoTotal: cotBase.montoTotal,
          cliente: cotBase.cliente,
          cumpleanero: cotBase.cumpleanero,
        },
        form: {
          numeroDocumento: '12345678',
          tipoComprobante: 'boleta',
          documentoTributario: 'DNI',
          horarioInicio: '09:00',
          horarioFin: '12:00',
          adelanto1Monto: 500,
          adelanto1Fecha: isoUtc,
          adelanto2Monto: 0,
          adelanto2Fecha: '',
          montoGarantia: 500,
        },
      },
      printOpts,
    );
    expect(contratoHtml).toContain('20/09/2026');
    expect(contratoHtml).not.toContain('19/09/2026');
  });
});
