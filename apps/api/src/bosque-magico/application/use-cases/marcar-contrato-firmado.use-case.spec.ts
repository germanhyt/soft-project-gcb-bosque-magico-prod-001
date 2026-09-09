import { BadRequestException } from '@nestjs/common';
import { EtapaContrato, EtapaPedido, TipoAdjuntoContrato } from '@prisma/client';
import { EventsService } from '../../../events/events.service';
import { NotificacionProveedorService } from '../../domain/services/notificacion-proveedor.service';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { ContratoAdjuntosRepository } from '../../infrastructure/repositories/contrato-adjuntos.repository';
import { ContratosRepository } from '../../infrastructure/repositories/contratos.repository';
import { PedidosRepository } from '../../infrastructure/repositories/pedidos.repository';
import { MarcarContratoFirmadoUseCase } from './marcar-contrato-estado.use-case';

describe('MarcarContratoFirmadoUseCase', () => {
  const contratos = {
    obtenerPorId: jest.fn(),
    marcarFirmado: jest.fn(),
  };
  const adjuntos = { obtenerPorContratoYTipo: jest.fn() };
  const auditoria = { registrar: jest.fn() };
  const events = { eventoActualizado: jest.fn() };
  const pedidos = {
    listarProveedorPorEventoYEtapa: jest.fn(),
    actualizar: jest.fn(),
  };
  const notificacionProveedor = {
    cargarConfig: jest.fn(),
    notificarAlSolicitar: jest.fn(),
  };

  const useCase = new MarcarContratoFirmadoUseCase(
    contratos as unknown as ContratosRepository,
    adjuntos as unknown as ContratoAdjuntosRepository,
    auditoria as unknown as AuditoriaRepository,
    events as unknown as EventsService,
    pedidos as unknown as PedidosRepository,
    notificacionProveedor as unknown as NotificacionProveedorService,
  );

  const contrato = {
    id: 'con-1',
    numero: 'BM-CT-0001',
    eventoId: 'evt-1',
    etapa: EtapaContrato.enviado,
    montoTotal: 0,
    montoAdelanto: 0,
    montoPendiente: 0,
    montoGarantia: 0,
    adelanto1Monto: 0,
    adelanto2Monto: null,
    tokenPublico: 'tok',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    contratos.obtenerPorId.mockResolvedValue(contrato);
    adjuntos.obtenerPorContratoYTipo.mockImplementation(
      (_id: string, tipo: TipoAdjuntoContrato) =>
        Promise.resolve({ id: tipo, tipo }),
    );
    contratos.marcarFirmado.mockResolvedValue({
      ...contrato,
      etapa: EtapaContrato.firmado,
    });
    auditoria.registrar.mockResolvedValue(undefined);
    notificacionProveedor.cargarConfig.mockResolvedValue({ habilitado: false });
    pedidos.listarProveedorPorEventoYEtapa.mockResolvedValue([]);
  });

  it('marca firmado sin solicitar pedidos si el auto está apagado', async () => {
    const res = await useCase.ejecutar('con-1');

    expect(contratos.marcarFirmado).toHaveBeenCalledWith('con-1');
    expect(pedidos.actualizar).not.toHaveBeenCalled();
    expect(notificacionProveedor.notificarAlSolicitar).not.toHaveBeenCalled();
    expect(res.etapa).toBe(EtapaContrato.firmado);
    expect(res.solicitarAutomatico).toEqual({
      pedidos: 0,
      notificaciones: [],
    });
  });

  it('pasa pedidos pendientes a solicitado y notifica si el auto está activo', async () => {
    notificacionProveedor.cargarConfig.mockResolvedValue({ habilitado: true });
    pedidos.listarProveedorPorEventoYEtapa.mockResolvedValue([
      { id: 'ped-1', tipo: 'proveedor' },
    ]);
    notificacionProveedor.notificarAlSolicitar.mockResolvedValue({
      enviado: true,
    });

    const res = await useCase.ejecutar('con-1');

    expect(pedidos.listarProveedorPorEventoYEtapa).toHaveBeenCalledWith('evt-1', [
      EtapaPedido.pendiente,
    ]);
    expect(pedidos.actualizar).toHaveBeenCalledWith('ped-1', {
      etapa: EtapaPedido.solicitado,
    });
    expect(notificacionProveedor.notificarAlSolicitar).toHaveBeenCalledWith(
      'ped-1',
      expect.objectContaining({ estadoContrato: expect.stringMatching(/firmado/) }),
    );
    expect(res.solicitarAutomatico.pedidos).toBe(1);
    expect(res.solicitarAutomatico.notificaciones[0].enviado).toBe(true);
  });

  it('exige ambas firmas', async () => {
    adjuntos.obtenerPorContratoYTipo.mockResolvedValue(null);
    await expect(useCase.ejecutar('con-1')).rejects.toThrow(BadRequestException);
    expect(contratos.marcarFirmado).not.toHaveBeenCalled();
  });
});
