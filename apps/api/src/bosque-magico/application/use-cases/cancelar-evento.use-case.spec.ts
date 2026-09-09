import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EtapaEvento, EtapaPedido, TipoPedido } from '@prisma/client';
import { EventsService } from '../../../events/events.service';
import { NotificacionProveedorService } from '../../domain/services/notificacion-proveedor.service';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { ContratosRepository } from '../../infrastructure/repositories/contratos.repository';
import { EventosRepository } from '../../infrastructure/repositories/eventos.repository';
import { PedidosRepository } from '../../infrastructure/repositories/pedidos.repository';
import { CancelarEventoUseCase } from './cancelar-evento.use-case';

describe('CancelarEventoUseCase', () => {
  const eventos = {
    obtenerPorId: jest.fn(),
    actualizar: jest.fn(),
  };
  const contratos = {
    obtenerPorEventoId: jest.fn(),
    marcarAnulado: jest.fn(),
  };
  const pedidos = {
    cancelarNoEntregadosPorEvento: jest.fn(),
  };
  const notificacionProveedor = {
    notificarCancelacion: jest.fn(),
  };
  const auditoria = { registrar: jest.fn() };
  const events = { eventoActualizado: jest.fn() };

  const useCase = new CancelarEventoUseCase(
    eventos as unknown as EventosRepository,
    contratos as unknown as ContratosRepository,
    pedidos as unknown as PedidosRepository,
    notificacionProveedor as unknown as NotificacionProveedorService,
    auditoria as unknown as AuditoriaRepository,
    events as unknown as EventsService,
  );

  const evento = {
    id: 'evt-1',
    etapa: EtapaEvento.por_confirmar,
    notas: null,
    montoTotal: 1000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    eventos.obtenerPorId.mockResolvedValue(evento);
    eventos.actualizar.mockResolvedValue({
      ...evento,
      etapa: EtapaEvento.cancelado,
    });
    contratos.obtenerPorEventoId.mockResolvedValue({
      id: 'con-1',
      etapa: 'enviado',
    });
    contratos.marcarAnulado.mockResolvedValue({ id: 'con-1', etapa: 'anulado' });
    pedidos.cancelarNoEntregadosPorEvento.mockResolvedValue([
      {
        id: 'ped-1',
        tipo: TipoPedido.proveedor,
        etapa: EtapaPedido.solicitado,
      },
      {
        id: 'ped-2',
        tipo: TipoPedido.proveedor,
        etapa: EtapaPedido.pendiente,
      },
    ]);
    notificacionProveedor.notificarCancelacion.mockResolvedValue({
      enviado: true,
    });
    auditoria.registrar.mockResolvedValue(undefined);
  });

  it('anula contrato, cancela pedidos y avisa solo a proveedores solicitados', async () => {
    const res = await useCase.ejecutar('evt-1', { motivo: 'cliente bajó' });

    expect(eventos.actualizar).toHaveBeenCalledWith(
      'evt-1',
      expect.objectContaining({ etapa: EtapaEvento.cancelado }),
    );
    expect(contratos.marcarAnulado).toHaveBeenCalledWith('con-1');
    expect(pedidos.cancelarNoEntregadosPorEvento).toHaveBeenCalledWith('evt-1');
    expect(notificacionProveedor.notificarCancelacion).toHaveBeenCalledTimes(1);
    expect(notificacionProveedor.notificarCancelacion).toHaveBeenCalledWith(
      'ped-1',
      'cliente bajó',
    );
    expect(res.contratoAnulado).toBe(true);
    expect(res.pedidosCancelados).toBe(2);
    expect(res.notificacionesProveedor).toHaveLength(1);
  });

  it('no notifica si no había pedidos intervinientes', async () => {
    pedidos.cancelarNoEntregadosPorEvento.mockResolvedValue([]);
    contratos.obtenerPorEventoId.mockResolvedValue(null);

    const res = await useCase.ejecutar('evt-1', {});

    expect(contratos.marcarAnulado).not.toHaveBeenCalled();
    expect(notificacionProveedor.notificarCancelacion).not.toHaveBeenCalled();
    expect(res.contratoAnulado).toBe(false);
    expect(res.pedidosCancelados).toBe(0);
  });

  it('rechaza evento ya cerrado', async () => {
    eventos.obtenerPorId.mockResolvedValue({
      ...evento,
      etapa: EtapaEvento.cancelado,
    });

    await expect(useCase.ejecutar('evt-1', {})).rejects.toThrow(
      BadRequestException,
    );
  });

  it('lanza NotFoundException si no existe', async () => {
    eventos.obtenerPorId.mockResolvedValue(null);
    await expect(useCase.ejecutar('x', {})).rejects.toThrow(NotFoundException);
  });
});
