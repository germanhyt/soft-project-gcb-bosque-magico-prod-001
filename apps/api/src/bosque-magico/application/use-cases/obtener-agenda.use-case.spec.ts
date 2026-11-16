import { ObtenerAgendaUseCase } from './obtener-agenda.use-case';
import { CotizacionesRepository } from '../../infrastructure/repositories/cotizaciones.repository';
import { EventosRepository } from '../../infrastructure/repositories/eventos.repository';

describe('ObtenerAgendaUseCase', () => {
  const eventos = {
    listar: jest.fn(),
    contarPorEtapa: jest.fn(),
    proximos: jest.fn(),
  };
  const cotizaciones = {
    listarParaCalendario: jest.fn(),
  };

  const useCase = new ObtenerAgendaUseCase(
    eventos as unknown as EventosRepository,
    cotizaciones as unknown as CotizacionesRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    eventos.listar.mockResolvedValue([
      {
        id: 'ev-1',
        fechaEvento: new Date('2026-11-16T00:00:00.000Z'),
        montoTotal: 100,
        etapa: 'confirmado',
      },
    ]);
    eventos.contarPorEtapa.mockResolvedValue([]);
    eventos.proximos.mockResolvedValue([]);
  });

  it('publica el borrador en el mismo día del evento y descarta la aceptada', async () => {
    cotizaciones.listarParaCalendario.mockResolvedValue([
      {
        id: 'cot-borrador',
        codigo: 'BM-10',
        etapa: 'borrador',
        fechaEvento: new Date('2026-11-16T00:00:00.000Z'),
        turno: 'turno_2',
        horarioInicio: '14:00',
        horarioFin: '17:00',
        cliente: { nombreCompleto: 'Ana Ruiz' },
      },
      {
        id: 'cot-aceptada',
        codigo: 'BM-11',
        etapa: 'aceptada',
        fechaEvento: new Date('2026-11-16T00:00:00.000Z'),
        turno: 'turno_1',
        horarioInicio: '09:00',
        horarioFin: '12:00',
        cliente: { nombreCompleto: 'Luis Paz' },
      },
    ]);

    const res = await useCase.ejecutar('2026-11-01', '2026-11-30');
    const dia = res.agenda.find((d) => d.fecha === '2026-11-16');

    expect(dia?.eventos).toHaveLength(1);
    expect(dia?.cotizaciones).toEqual([
      expect.objectContaining({
        id: 'cot-borrador',
        etapa: 'borrador',
        codigo: 'BM-10',
        cliente: { nombreCompleto: 'Ana Ruiz' },
      }),
    ]);
    expect(cotizaciones.listarParaCalendario).toHaveBeenCalledTimes(1);
  });

  it('deja visible un día que solo tiene una cotización enviada', async () => {
    eventos.listar.mockResolvedValue([]);
    cotizaciones.listarParaCalendario.mockResolvedValue([
      {
        id: 'cot-enviada',
        codigo: 'BM-12',
        etapa: 'enviada',
        fechaEvento: new Date('2026-12-01T00:00:00.000Z'),
        turno: 'turno_1',
        horarioInicio: '09:00',
        horarioFin: '12:00',
        cliente: { nombreCompleto: 'Mia Sol' },
      },
    ]);

    const res = await useCase.ejecutar('2026-12-01', '2026-12-31');

    expect(res.agenda).toEqual([
      expect.objectContaining({
        fecha: '2026-12-01',
        eventos: [],
        cotizaciones: [expect.objectContaining({ id: 'cot-enviada', etapa: 'enviada' })],
      }),
    ]);
  });
});
