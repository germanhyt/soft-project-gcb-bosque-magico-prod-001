import { buildContratoPrintHtml } from './contrato-print';

const payload = {
  cotizacion: {
    codigo: 'BM-1',
    fechaEvento: '2026-12-01',
    turno: 'turno_1',
    cantidadNinos: 10,
    montoBase: 800,
    montoNinosExtra: 0,
    montoItems: 0,
    montoTotal: 800,
    cliente: { nombreCompleto: 'Ana Ruiz', celular: '999111222' },
    cumpleanero: { nombre: 'Leo' },
    items: [],
  },
  form: {
    numeroDocumento: '',
    tipoComprobante: 'boleta' as const,
    documentoTributario: '',
    horarioInicio: '09:00',
    horarioFin: '12:00',
    adelanto1Monto: 500,
    adelanto1Fecha: '2026-11-20',
    adelanto2Monto: 0,
    adelanto2Fecha: '',
    montoGarantia: 500,
  },
  fechaEmision: '2026-11-16',
};

describe('precontrato en el impreso', () => {
  it('usa las cláusulas del contrato y deja claro que es una reserva', () => {
    const html = buildContratoPrintHtml(payload, {
      logoUrl: '/logo.png',
      esPrecontrato: true,
    });

    expect(html).toContain('PRECONTRATO DE RESERVA');
    expect(html).toContain('sujeta al pago del adelanto');
    expect(html).toContain('Monto total cotizado');
    expect(html).toContain('Términos y condiciones');
    expect(html).not.toContain('CONTRATO FIESTAS INFANTILES');
  });

  it('el contrato normal conserva su título', () => {
    const html = buildContratoPrintHtml(payload, { logoUrl: '/logo.png' });
    expect(html).toContain('CONTRATO FIESTAS INFANTILES');
    expect(html).toContain('Monto total contratado');
  });
});
