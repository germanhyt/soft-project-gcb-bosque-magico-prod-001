import { OrigenProducto, TipoPedido } from '@prisma/client';
import { GenerarPedidosEventoUseCase } from './generar-pedidos-evento.use-case';

describe('GenerarPedidosEventoUseCase', () => {
  const prisma = { bosqueMagicoProducto: { findUnique: jest.fn() } };
  const eventos = { obtenerPorIdParaContrato: jest.fn() };
  const pedidos = {
    contarPorEvento: jest.fn(),
    crearMuchos: jest.fn(),
  };
  const notificacionProveedor = { notificarNegociacion: jest.fn() };

  let useCase: GenerarPedidosEventoUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    notificacionProveedor.notificarNegociacion.mockResolvedValue({
      enviado: true,
    });
    useCase = new GenerarPedidosEventoUseCase(
      prisma as never,
      eventos as never,
      pedidos as never,
      notificacionProveedor as never,
    );
  });

  it('notifica negociación al crear pedidos de proveedor', async () => {
    pedidos.contarPorEvento.mockResolvedValue(0);
    eventos.obtenerPorIdParaContrato.mockResolvedValue({
      id: 'evt-1',
      fechaEvento: new Date('2026-09-20T12:00:00.000Z'),
      cotizacion: {
        items: [{ productoId: 'prod-1', nombre: 'Show Magia', cantidad: 1, precioUnitario: 500 }],
      },
    });
    prisma.bosqueMagicoProducto.findUnique.mockResolvedValue({
      id: 'prod-1',
      origen: OrigenProducto.proveedor,
      proveedorId: 'prov-1',
      categoria: 'show',
      costoInterno: { toString: () => '300' },
    });
    pedidos.crearMuchos.mockResolvedValue([
      {
        id: 'ped-1',
        tipo: TipoPedido.proveedor,
        nombre: 'Show Magia',
        cantidad: 1,
        costo: 300,
        tokenPublico: 'tok',
      },
    ]);

    const rows = await useCase.ejecutar('evt-1');

    expect(rows).toHaveLength(1);
    expect(notificacionProveedor.notificarNegociacion).toHaveBeenCalledWith(
      'ped-1',
    );
  });

  it('usa 60% del precio de catálogo si interno e ítem son 0', async () => {
    pedidos.contarPorEvento.mockResolvedValue(0);
    eventos.obtenerPorIdParaContrato.mockResolvedValue({
      id: 'evt-1',
      fechaEvento: new Date('2026-09-20T12:00:00.000Z'),
      cotizacion: {
        items: [
          {
            productoId: 'prod-1',
            nombre: 'Bocaditos',
            cantidad: 1,
            precioUnitario: 0,
          },
        ],
      },
    });
    prisma.bosqueMagicoProducto.findUnique.mockResolvedValue({
      id: 'prod-1',
      origen: OrigenProducto.proveedor,
      proveedorId: 'prov-1',
      categoria: 'catering',
      costoInterno: null,
      precioLunesViernes: 46,
    });
    pedidos.crearMuchos.mockResolvedValue([
      {
        id: 'ped-1',
        tipo: TipoPedido.proveedor,
        nombre: 'Bocaditos',
        cantidad: 1,
        costo: 27.6,
        tokenPublico: 'tok',
      },
    ]);

    await useCase.ejecutar('evt-1');

    expect(pedidos.crearMuchos).toHaveBeenCalledWith([
      expect.objectContaining({ costo: 27.6 }),
    ]);
  });

  it('no genera ni notifica si el evento ya tiene pedidos', async () => {
    pedidos.contarPorEvento.mockResolvedValue(2);

    const rows = await useCase.ejecutar('evt-1');

    expect(rows).toEqual([]);
    expect(pedidos.crearMuchos).not.toHaveBeenCalled();
    expect(notificacionProveedor.notificarNegociacion).not.toHaveBeenCalled();
  });
});
