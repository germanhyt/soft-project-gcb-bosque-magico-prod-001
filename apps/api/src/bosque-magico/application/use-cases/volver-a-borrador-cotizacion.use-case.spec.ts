import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EtapaContrato, EtapaCotizacion, EtapaEvento } from '@prisma/client';
import { EventsService } from '../../../events/events.service';
import { CLAVE_FLUJO_COTIZACION_VOLVER_BORRADOR_ACEPTADA } from '../../domain/constants/flujo-config';
import { SolicitudCotizacionSyncService } from '../../domain/services/solicitud-cotizacion-sync.service';
import { ConfiguracionRepository } from '../../infrastructure/repositories/configuracion.repository';
import { ContratosRepository } from '../../infrastructure/repositories/contratos.repository';
import { CotizacionesRepository } from '../../infrastructure/repositories/cotizaciones.repository';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { CancelarEventoUseCase } from './cancelar-evento.use-case';
import { VolverABorradorCotizacionUseCase } from './volver-a-borrador-cotizacion.use-case';

describe('VolverABorradorCotizacionUseCase', () => {
  const cotizaciones = {
    obtenerPorId: jest.fn(),
    actualizarEtapa: jest.fn(),
  };
  const auditoria = { registrar: jest.fn() };
  const events = { cotizacionActualizada: jest.fn() };
  const configuracion = { obtenerPorClave: jest.fn() };
  const contratos = { obtenerPorEventoId: jest.fn() };
  const cancelarEvento = { ejecutar: jest.fn() };
  const solicitudSync = { alDeshacerAceptacion: jest.fn() };

  const useCase = new VolverABorradorCotizacionUseCase(
    cotizaciones as unknown as CotizacionesRepository,
    auditoria as unknown as AuditoriaRepository,
    events as unknown as EventsService,
    configuracion as unknown as ConfiguracionRepository,
    contratos as unknown as ContratosRepository,
    cancelarEvento as unknown as CancelarEventoUseCase,
    solicitudSync as unknown as Pick<
      SolicitudCotizacionSyncService,
      'alDeshacerAceptacion'
    > as SolicitudCotizacionSyncService,
  );

  const cotBase = {
    id: 'cot-1',
    codigo: 'BM-001',
    tokenPublico: 'tok',
    montoBase: 0,
    montoNinosExtra: 0,
    montoItems: 0,
    montoTotal: 0,
    solicitudId: 'sol-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    configuracion.obtenerPorClave.mockResolvedValue({
      clave: CLAVE_FLUJO_COTIZACION_VOLVER_BORRADOR_ACEPTADA,
      valor: true,
    });
    cotizaciones.actualizarEtapa.mockImplementation(async (_id, data) => ({
      ...cotBase,
      etapa: data.etapa,
    }));
    auditoria.registrar.mockResolvedValue(undefined);
    solicitudSync.alDeshacerAceptacion.mockResolvedValue(undefined);
    cancelarEvento.ejecutar.mockResolvedValue({});
  });

  it('rechaza si está en borrador', async () => {
    cotizaciones.obtenerPorId.mockResolvedValue({
      ...cotBase,
      etapa: EtapaCotizacion.borrador,
    });

    await expect(useCase.ejecutar('cot-1')).rejects.toThrow(BadRequestException);
    expect(cotizaciones.actualizarEtapa).not.toHaveBeenCalled();
  });

  it('pasa de enviada a borrador', async () => {
    cotizaciones.obtenerPorId.mockResolvedValue({
      ...cotBase,
      etapa: EtapaCotizacion.enviada,
    });

    const res = await useCase.ejecutar('cot-1');

    expect(cotizaciones.actualizarEtapa).toHaveBeenCalledWith(
      'cot-1',
      expect.objectContaining({ etapa: EtapaCotizacion.borrador }),
    );
    expect(cancelarEvento.ejecutar).not.toHaveBeenCalled();
    expect(solicitudSync.alDeshacerAceptacion).not.toHaveBeenCalled();
    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'volver_borrador' }),
    );
    expect(res.etapa).toBe(EtapaCotizacion.borrador);
  });

  it('deshace aceptación: cancela evento por confirmar y reabre el lead', async () => {
    cotizaciones.obtenerPorId.mockResolvedValue({
      ...cotBase,
      etapa: EtapaCotizacion.aceptada,
      eventos: [{ id: 'evt-1', etapa: EtapaEvento.por_confirmar }],
    });
    contratos.obtenerPorEventoId.mockResolvedValue(null);

    await useCase.ejecutar('cot-1');

    expect(cancelarEvento.ejecutar).toHaveBeenCalledWith(
      'evt-1',
      expect.objectContaining({ motivo: expect.stringMatching(/borrador/i) }),
    );
    expect(solicitudSync.alDeshacerAceptacion).toHaveBeenCalledWith('sol-1');
    expect(cotizaciones.actualizarEtapa).toHaveBeenCalledWith(
      'cot-1',
      expect.objectContaining({
        etapa: EtapaCotizacion.borrador,
        aceptadaEn: null,
      }),
    );
  });

  it('rechaza aceptación si la config está deshabilitada', async () => {
    configuracion.obtenerPorClave.mockResolvedValue({
      clave: CLAVE_FLUJO_COTIZACION_VOLVER_BORRADOR_ACEPTADA,
      valor: false,
    });
    cotizaciones.obtenerPorId.mockResolvedValue({
      ...cotBase,
      etapa: EtapaCotizacion.aceptada,
      eventos: [{ id: 'evt-1', etapa: EtapaEvento.por_confirmar }],
    });

    await expect(useCase.ejecutar('cot-1')).rejects.toThrow(BadRequestException);
    expect(cancelarEvento.ejecutar).not.toHaveBeenCalled();
  });

  it('permite aceptación si la clave de config no existe (default ON)', async () => {
    configuracion.obtenerPorClave.mockResolvedValue(null);
    cotizaciones.obtenerPorId.mockResolvedValue({
      ...cotBase,
      etapa: EtapaCotizacion.aceptada,
      eventos: [{ id: 'evt-1', etapa: EtapaEvento.por_confirmar }],
    });
    contratos.obtenerPorEventoId.mockResolvedValue(null);

    await useCase.ejecutar('cot-1');

    expect(cancelarEvento.ejecutar).toHaveBeenCalled();
  });

  it('rechaza si el evento ya está confirmado', async () => {
    cotizaciones.obtenerPorId.mockResolvedValue({
      ...cotBase,
      etapa: EtapaCotizacion.aceptada,
      eventos: [{ id: 'evt-1', etapa: EtapaEvento.confirmado }],
    });

    await expect(useCase.ejecutar('cot-1')).rejects.toThrow(
      /confirmado o realizado/,
    );
    expect(cancelarEvento.ejecutar).not.toHaveBeenCalled();
  });

  it('rechaza si el contrato está enviado', async () => {
    cotizaciones.obtenerPorId.mockResolvedValue({
      ...cotBase,
      etapa: EtapaCotizacion.aceptada,
      eventos: [{ id: 'evt-1', etapa: EtapaEvento.por_confirmar }],
    });
    contratos.obtenerPorEventoId.mockResolvedValue({
      id: 'con-1',
      etapa: EtapaContrato.enviado,
    });

    await expect(useCase.ejecutar('cot-1')).rejects.toThrow(
      /contrato ya fue enviado o firmado/,
    );
    expect(cancelarEvento.ejecutar).not.toHaveBeenCalled();
  });

  it('anula contrato en borrador al cancelar el evento', async () => {
    cotizaciones.obtenerPorId.mockResolvedValue({
      ...cotBase,
      etapa: EtapaCotizacion.aceptada,
      eventos: [{ id: 'evt-1', etapa: EtapaEvento.por_confirmar }],
    });
    contratos.obtenerPorEventoId.mockResolvedValue({
      id: 'con-1',
      etapa: EtapaContrato.borrador,
    });

    await useCase.ejecutar('cot-1');

    expect(cancelarEvento.ejecutar).toHaveBeenCalled();
  });

  it('lanza NotFoundException si no existe', async () => {
    cotizaciones.obtenerPorId.mockResolvedValue(null);
    await expect(useCase.ejecutar('x')).rejects.toThrow(NotFoundException);
  });
});
