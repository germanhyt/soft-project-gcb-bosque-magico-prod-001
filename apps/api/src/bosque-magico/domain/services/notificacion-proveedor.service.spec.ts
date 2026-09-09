import { NotificacionProveedorService } from './notificacion-proveedor.service';

describe('NotificacionProveedorService', () => {
  const configuracion = {
    listarTodas: jest.fn(),
    obtenerPorClave: jest.fn(),
  };
  const eventos = { obtenerPorId: jest.fn() };
  const pedidos = { obtenerPorId: jest.fn() };
  const smtp = {
    estaActivo: jest.fn(),
    enviarCorreo: jest.fn(),
  };
  const config = {
    get: jest.fn().mockReturnValue('http://localhost:5173'),
  };

  let service: NotificacionProveedorService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificacionProveedorService(
      configuracion as never,
      eventos as never,
      pedidos as never,
      smtp as never,
      config as never,
    );
  });

  it('no envía si la notificación está deshabilitada', async () => {
    configuracion.listarTodas.mockResolvedValue([
      { clave: 'pedidos_proveedor.notificar_correo', valor: false },
    ]);

    const result = await service.notificarAlSolicitar('ped-1');

    expect(result).toEqual({ enviado: false, motivo: 'deshabilitado' });
    expect(smtp.enviarCorreo).not.toHaveBeenCalled();
  });

  it('envía correo al proveedor con plantilla aplicada', async () => {
    configuracion.listarTodas.mockResolvedValue([
      { clave: 'pedidos_proveedor.notificar_correo', valor: true },
      {
        clave: 'pedidos_proveedor.asunto',
        valor: 'Pedido {{servicio}} — {{fecha}}',
      },
      {
        clave: 'pedidos_proveedor.cuerpo',
        valor: 'Hola {{proveedor}}, servicio {{servicio}} para {{cliente}}.',
      },
    ]);
    configuracion.obtenerPorClave.mockResolvedValue({
      clave: 'turnos.turno_1',
      valor: { etiqueta: 'Mañana', horario: '9:00 a.m. - 12:00 p.m.' },
    });
    smtp.estaActivo.mockResolvedValue(true);
    pedidos.obtenerPorId.mockResolvedValue({
      id: 'ped-1',
      eventoId: 'evt-1',
      tipo: 'proveedor',
      nombre: 'Show Magia',
      cantidad: 1,
      costo: { toString: () => '300' },
      notas: null,
      tokenPublico: 'abc123',
      proveedor: { nombre: 'Mimo Pro', correo: 'mimo@test.com' },
    });
    eventos.obtenerPorId.mockResolvedValue({
      id: 'evt-1',
      fechaEvento: new Date('2026-07-15T12:00:00.000Z'),
      turno: 'turno_1',
      cliente: { nombreCompleto: 'Ana Pérez' },
    });

    const result = await service.notificarAlSolicitar('ped-1', {
      estadoContrato: 'El contrato ya está firmado; el evento se realizará.',
    });

    expect(result.enviado).toBe(true);
    expect(smtp.enviarCorreo).toHaveBeenCalledWith({
      destino: 'mimo@test.com',
      asunto: 'Pedido Show Magia — 15 de julio de 2026',
      texto: 'Hola Mimo Pro, servicio Show Magia para Ana Pérez.',
    });
  });

  it('envía cancelación aunque la notificación de solicitud esté deshabilitada', async () => {
    configuracion.listarTodas.mockResolvedValue([
      { clave: 'pedidos_proveedor.notificar_correo', valor: false },
      {
        clave: 'pedidos_proveedor.cancelacion_asunto',
        valor: 'Cancelado {{servicio}}',
      },
      {
        clave: 'pedidos_proveedor.cancelacion_cuerpo',
        valor: 'Hola {{proveedor}}, {{motivo}} servicio {{servicio}}.',
      },
    ]);
    configuracion.obtenerPorClave.mockResolvedValue({
      clave: 'turnos.turno_1',
      valor: { etiqueta: 'Mañana', horario: '9:00 a.m. - 12:00 p.m.' },
    });
    smtp.estaActivo.mockResolvedValue(true);
    pedidos.obtenerPorId.mockResolvedValue({
      id: 'ped-1',
      eventoId: 'evt-1',
      tipo: 'proveedor',
      nombre: 'Show Magia',
      cantidad: 1,
      costo: { toString: () => '300' },
      notas: null,
      tokenPublico: 'abc123',
      proveedor: { nombre: 'Mimo Pro', correo: 'mimo@test.com' },
    });
    eventos.obtenerPorId.mockResolvedValue({
      id: 'evt-1',
      fechaEvento: new Date('2026-07-15T12:00:00.000Z'),
      turno: 'turno_1',
      cantidadNinos: 12,
      tematica: null,
      cumpleanero: { edad: 7 },
      cliente: { nombreCompleto: 'Ana Pérez' },
    });

    const result = await service.notificarCancelacion('ped-1', 'cliente reprogramó');

    expect(result.enviado).toBe(true);
    expect(smtp.enviarCorreo).toHaveBeenCalledWith({
      destino: 'mimo@test.com',
      asunto: 'Cancelado Show Magia',
      texto: 'Hola Mimo Pro, Motivo: cliente reprogramó servicio Show Magia.',
    });
  });
});
