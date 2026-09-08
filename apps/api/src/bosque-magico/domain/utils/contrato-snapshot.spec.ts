import { buildContratoSnapshot } from './contrato-snapshot';

describe('buildContratoSnapshot', () => {
  const base = {
    id: 'evt-1',
    fechaEvento: new Date('2026-09-20T15:00:00.000Z'),
    turno: 'turno_1',
    zona: 'Bosque Mágico',
    cantidadNinos: 20,
    tematica: 'Selva',
    montoTotal: 1770,
    cliente: {
      nombreCompleto: 'Ana Pérez',
      celular: '999',
      correo: null,
      numeroDocumento: '12345678',
      tipoDocumento: 'DNI',
    },
    cumpleanero: { nombre: 'Leo', edad: 6 },
    cotizacion: {
      id: 'cot-1',
      codigo: 'COT-001',
      paquete: 'Premium',
      tematica: 'Selva',
      montoBase: 1770,
      montoNinosExtra: 0,
      montoItems: 0,
      montoTotal: 1770,
      extrasPermitidos: ['Piñata', '  Torta temática '],
      extrasPermitidosComentario: 'Entrega 30 min antes',
      items: [],
    },
  };

  it('copia extras permitidos y comentario al snapshot del contrato', () => {
    const snap = buildContratoSnapshot(base);

    expect(snap.cotizacion.extrasPermitidos).toEqual(['Piñata', 'Torta temática']);
    expect(snap.cotizacion.extrasPermitidosComentario).toBe('Entrega 30 min antes');
  });

  it('deja extras en null si la cotización no tiene snapshot', () => {
    const snap = buildContratoSnapshot({
      ...base,
      cotizacion: {
        ...base.cotizacion,
        extrasPermitidos: undefined,
        extrasPermitidosComentario: null,
      },
    });

    expect(snap.cotizacion.extrasPermitidos).toBeNull();
    expect(snap.cotizacion.extrasPermitidosComentario).toBeNull();
  });
});
