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

  it('pasa pendientes a Solicitado al firmar aunque el correo automático esté apagado', async () => {
    pedidos.listarProveedorPorEventoYEtapa.mockImplementation(
      (_eventoId: string, etapas: EtapaPedido[]) => {
        if (etapas.includes(EtapaPedido.pendiente)) {
          return Promise.resolve([{ id: 'ped-1', tipo: 'proveedor' }]);
        }
        return Promise.resolve([]);
      },
    );

    const res = await useCase.ejecutar('con-1');

    expect(contratos.marcarFirmado).toHaveBeenCalledWith('con-1');
    expect(pedidos.actualizar).toHaveBeenCalledWith('ped-1', {
      etapa: EtapaPedido.solicitado,
    });
    expect(notificacionProveedor.notificarAlSolicitar).not.toHaveBeenCalled();
    expect(res.etapa).toBe(EtapaContrato.firmado);
    expect(res.solicitarAutomatico).toEqual({
      pedidos: 1,
      notificaciones: [],
    });
  });

  it('notifica pendientes (pasados a Solicitado) y ya confirmados si el auto está activo', async () => {
    notificacionProveedor.cargarConfig.mockResolvedValue({ habilitado: true });
    pedidos.listarProveedorPorEventoYEtapa.mockImplementation(
      (_eventoId: string, etapas: EtapaPedido[]) => {
        if (etapas.includes(EtapaPedido.pendiente)) {
          return Promise.resolve([{ id: 'ped-1', tipo: 'proveedor' }]);
        }
        if (etapas.includes(EtapaPedido.confirmado)) {
          return Promise.resolve([{ id: 'ped-2', tipo: 'proveedor' }]);
        }
        return Promise.resolve([]);
      },
    );
    notificacionProveedor.notificarAlSolicitar.mockResolvedValue({
      enviado: true,
    });

    const res = await useCase.ejecutar('con-1');

    expect(pedidos.actualizar).toHaveBeenCalledWith('ped-1', {
      etapa: EtapaPedido.solicitado,
    });
    expect(pedidos.actualizar).not.toHaveBeenCalledWith(
      'ped-2',
      expect.anything(),
    );
    expect(notificacionProveedor.notificarAlSolicitar).toHaveBeenCalledWith(
      'ped-1',
      expect.objectContaining({ estadoContrato: expect.stringMatching(/firmado/) }),
    );
    expect(notificacionProveedor.notificarAlSolicitar).toHaveBeenCalledWith(
      'ped-2',
      expect.objectContaining({ estadoContrato: expect.stringMatching(/confirm/) }),
    );
    expect(res.solicitarAutomatico.pedidos).toBe(1);
    expect(res.solicitarAutomatico.notificaciones).toHaveLength(2);
  });

  it('exige ambas firmas', async () => {
    adjuntos.obtenerPorContratoYTipo.mockResolvedValue(null);
    await expect(useCase.ejecutar('con-1')).rejects.toThrow(BadRequestException);
    expect(contratos.marcarFirmado).not.toHaveBeenCalled();
  });
});
