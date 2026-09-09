import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EtapaCotizacion, TurnoInteres } from '@prisma/client';
import { EventsService } from '../../../events/events.service';
import { AceptarCotizacionUseCase } from './aceptar-cotizacion.use-case';
import { CotizacionesRepository } from '../../infrastructure/repositories/cotizaciones.repository';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { SolicitudCotizacionSyncService } from '../../domain/services/solicitud-cotizacion-sync.service';
import { AnticipacionEventoService } from '../../domain/services/anticipacion-evento.service';
import { GenerarPedidosEventoUseCase } from './generar-pedidos-evento.use-case';

const fecha = new Date(2026, 5, 15);
const cotBase = {
  id: 'cot-1',
  etapa: EtapaCotizacion.enviada,
  fechaEvento: fecha,
  turno: TurnoInteres.turno_1,
  codigo: 'BM-001',
  tokenPublico: 'tok',
  montoTotal: 500,
};

describe('AceptarCotizacionUseCase', () => {
  let useCase: AceptarCotizacionUseCase;
  let cotizaciones: jest.Mocked<
    Pick<
      CotizacionesRepository,
      | 'obtenerPorId'
      | 'obtenerPorToken'
      | 'listarEventosActivosEnFecha'
      | 'actualizarEtapa'
      | 'crearEventoDesdeCotizacion'
    >
  >;
  let auditoria: jest.Mocked<Pick<AuditoriaRepository, 'registrar'>>;
  let events: jest.Mocked<
    Pick<EventsService, 'cotizacionAceptada' | 'solicitudActualizada'>
  >;
  let solicitudSync: jest.Mocked<
    Pick<SolicitudCotizacionSyncService, 'alAceptarCotizacion'>
  >;
  let anticipacion: jest.Mocked<Pick<AnticipacionEventoService, 'validar'>>;
  let generarPedidos: jest.Mocked<
    Pick<GenerarPedidosEventoUseCase, 'ejecutar'>
  >;

  beforeEach(() => {
    cotizaciones = {
      obtenerPorId: jest.fn(),
      obtenerPorToken: jest.fn(),
      listarEventosActivosEnFecha: jest.fn(),
      actualizarEtapa: jest.fn(),
      crearEventoDesdeCotizacion: jest.fn(),
    };
    auditoria = { registrar: jest.fn().mockResolvedValue(undefined) };
    events = { cotizacionAceptada: jest.fn(), solicitudActualizada: jest.fn() };
    solicitudSync = {
      alAceptarCotizacion: jest.fn().mockResolvedValue(undefined),
    };
    anticipacion = { validar: jest.fn().mockResolvedValue(undefined) };
    generarPedidos = { ejecutar: jest.fn().mockResolvedValue(undefined) };
    useCase = new AceptarCotizacionUseCase(
      cotizaciones as unknown as CotizacionesRepository,
      auditoria as unknown as AuditoriaRepository,
      events as unknown as EventsService,
      solicitudSync as unknown as SolicitudCotizacionSyncService,
      anticipacion as unknown as AnticipacionEventoService,
      generarPedidos as unknown as GenerarPedidosEventoUseCase,
    );
  });

  it('rechaza aceptar cotización que no está enviada', async () => {
    cotizaciones.obtenerPorId.mockResolvedValue({
      ...cotBase,
      etapa: EtapaCotizacion.borrador,
    } as never);

    await expect(useCase.ejecutarPorId('cot-1')).rejects.toThrow(
      BadRequestException,
    );
    expect(cotizaciones.listarEventosActivosEnFecha).not.toHaveBeenCalled();
  });

  it('rechaza doble reserva en el mismo slot', async () => {
    cotizaciones.obtenerPorId.mockResolvedValue(cotBase as never);
    cotizaciones.listarEventosActivosEnFecha.mockResolvedValue([
      { id: 'evt-bloqueado', turno: TurnoInteres.turno_1 },
    ] as never);

    await expect(useCase.ejecutarPorId('cot-1')).rejects.toThrow(
      /ya no están disponibles/,
    );
    expect(cotizaciones.actualizarEtapa).not.toHaveBeenCalled();
  });

  it('rechaza overlap de turno personalizado con un turno estándar ocupado', async () => {
    cotizaciones.obtenerPorId.mockResolvedValue({
      ...cotBase,
      turno: TurnoInteres.turno_personalizado,
      horarioInicio: '11:00',
      horarioFin: '14:00',
    } as never);
    cotizaciones.listarEventosActivosEnFecha.mockResolvedValue([
      { id: 'evt-t1', turno: TurnoInteres.turno_1 },
    ] as never);

    await expect(useCase.ejecutarPorId('cot-1')).rejects.toThrow(
      /ya no están disponibles/,
    );
  });

  it('acepta cotización enviada y crea evento', async () => {
    cotizaciones.obtenerPorId.mockResolvedValue(cotBase as never);
    cotizaciones.listarEventosActivosEnFecha.mockResolvedValue([]);
    cotizaciones.actualizarEtapa.mockResolvedValue({
      ...cotBase,
      etapa: EtapaCotizacion.aceptada,
    } as never);
    cotizaciones.crearEventoDesdeCotizacion.mockResolvedValue({
      id: 'evt-1',
    } as never);

    const res = await useCase.ejecutarPorId('cot-1');

    expect(res.eventoId).toBe('evt-1');
    expect('mensaje' in res && res.mensaje).toContain('aceptada');
    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'aceptar', entidadId: 'cot-1' }),
    );
    expect(events.cotizacionAceptada).toHaveBeenCalledWith(
      'cot-1',
      'BM-001',
      'equipo',
      'evt-1',
    );
  });

  it('es idempotente si la cotización ya estaba aceptada', async () => {
    cotizaciones.obtenerPorToken.mockResolvedValue({
      ...cotBase,
      etapa: EtapaCotizacion.aceptada,
    } as never);
    cotizaciones.crearEventoDesdeCotizacion.mockResolvedValue({
      id: 'evt-existente',
    } as never);

    const res = await useCase.ejecutarPorToken('tok');

    expect('yaAceptada' in res && res.yaAceptada).toBe(true);
    expect(res.eventoId).toBe('evt-existente');
    expect(cotizaciones.listarEventosActivosEnFecha).not.toHaveBeenCalled();
    expect(cotizaciones.actualizarEtapa).not.toHaveBeenCalled();
    expect(auditoria.registrar).not.toHaveBeenCalled();
  });

  it('lanza NotFoundException si el token no existe', async () => {
    cotizaciones.obtenerPorToken.mockResolvedValue(null);

    await expect(useCase.ejecutarPorToken('invalido')).rejects.toThrow(
      NotFoundException,
    );
  });
});
