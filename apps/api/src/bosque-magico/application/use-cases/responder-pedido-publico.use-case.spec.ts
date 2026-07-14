import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EtapaPedido, TipoPedido } from '@prisma/client';
import { ResponderPedidoPublicoUseCase } from './responder-pedido-publico.use-case';

const pedidoBase = {
  id: 'ped-1',
  eventoId: 'evt-1',
  tipo: TipoPedido.proveedor,
  tokenPublico: 'tok',
  nombre: 'Show',
  cantidad: 1,
  costo: 100,
  proveedor: { nombre: 'Mimo' },
  evento: {
    fechaEvento: new Date('2026-07-15'),
    turno: 'turno_1',
    cantidadNinos: 20,
    tematica: null,
    cumpleanero: { edad: 8 },
    cliente: { nombreCompleto: 'Ana' },
  },
};

describe('ResponderPedidoPublicoUseCase', () => {
  const pedidos = {
    obtenerPorToken: jest.fn(),
    actualizar: jest.fn(),
  };
  const auditoria = { registrar: jest.fn() };
  const events = { eventoActualizado: jest.fn() };

  let useCase: ResponderPedidoPublicoUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ResponderPedidoPublicoUseCase(
      pedidos as never,
      auditoria as never,
      events as never,
    );
  });

  it('confirma pedido en pendiente', async () => {
    pedidos.obtenerPorToken
      .mockResolvedValueOnce({
        ...pedidoBase,
        etapa: EtapaPedido.pendiente,
        notas: null,
      })
      .mockResolvedValueOnce({
        ...pedidoBase,
        etapa: EtapaPedido.confirmado,
        notas: null,
      });
    pedidos.actualizar.mockResolvedValue({ id: 'ped-1' });

    const res = await useCase.confirmar('tok');

    expect(res.mensaje).toContain('confirmada');
    expect(pedidos.actualizar).toHaveBeenCalledWith('ped-1', {
      etapa: EtapaPedido.confirmado,
    });
    expect(events.eventoActualizado).toHaveBeenCalled();
  });

  it('rechaza con motivo', async () => {
    pedidos.obtenerPorToken
      .mockResolvedValueOnce({
        ...pedidoBase,
        etapa: EtapaPedido.solicitado,
        notas: 'Previo',
      })
      .mockResolvedValueOnce({
        ...pedidoBase,
        etapa: EtapaPedido.cancelado,
        notas: 'Previo\nRechazo proveedor: No disponible',
      });
    pedidos.actualizar.mockResolvedValue({ id: 'ped-1' });

    await useCase.rechazar('tok', { motivo: 'No disponible' });

    expect(pedidos.actualizar).toHaveBeenCalledWith('ped-1', {
      etapa: EtapaPedido.cancelado,
      notas: 'Previo\nRechazo proveedor: No disponible',
    });
  });

  it('no permite responder pedido ya confirmado', async () => {
    pedidos.obtenerPorToken.mockResolvedValue({
      ...pedidoBase,
      etapa: EtapaPedido.confirmado,
      notas: null,
    });

    await expect(useCase.confirmar('tok')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('404 si token inválido', async () => {
    pedidos.obtenerPorToken.mockResolvedValue(null);
    await expect(useCase.confirmar('bad')).rejects.toBeInstanceOf(NotFoundException);
  });
});
