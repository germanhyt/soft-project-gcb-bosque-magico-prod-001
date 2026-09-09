import { ListarConfiguracionPanelUseCase } from './listar-configuracion-panel.use-case';
import { ConfiguracionRepository } from '../../infrastructure/repositories/configuracion.repository';

describe('ListarConfiguracionPanelUseCase', () => {
  let useCase: ListarConfiguracionPanelUseCase;
  let configuracion: jest.Mocked<
    Pick<ConfiguracionRepository, 'listarTodas' | 'crearSiNoExiste'>
  >;

  beforeEach(() => {
    configuracion = {
      listarTodas: jest.fn(),
      crearSiNoExiste: jest.fn().mockResolvedValue({}),
    };
    useCase = new ListarConfiguracionPanelUseCase(
      configuracion as unknown as ConfiguracionRepository,
    );
  });

  it('excluye clave obsoleta tarifas.precio_nino_extra de numericas', async () => {
    configuracion.listarTodas.mockResolvedValue([
      {
        id: '1',
        clave: 'tarifas.precio_nino_extra',
        valor: 25,
        descripcion: null,
        esPublico: true,
      },
      {
        id: '1b',
        clave: 'extras.precio_nino_extra',
        valor: 10,
        descripcion: null,
        esPublico: true,
      },
      {
        id: '2',
        clave: 'shows.precio_nino_extra',
        valor: 15,
        descripcion: null,
        esPublico: true,
      },
      {
        id: '3',
        clave: 'shows.ninos_incluidos',
        valor: 20,
        descripcion: null,
        esPublico: true,
      },
      {
        id: '4',
        clave: 'ninos.maximo_permitido',
        valor: 30,
        descripcion: null,
        esPublico: true,
      },
    ] as never);

    const res = await useCase.ejecutar();
    const claves = res.numericas.map((i) => i.clave);

    expect(claves).not.toContain('tarifas.precio_nino_extra');
    expect(claves).not.toContain('extras.precio_nino_extra');
    expect(claves).toContain('shows.precio_nino_extra');
    expect(claves).toContain('shows.ninos_incluidos');
    expect(claves).toContain('ninos.maximo_permitido');
  });

  it('asegura la clave de flujo volver a borrador aceptada', async () => {
    configuracion.listarTodas.mockResolvedValue([] as never);

    await useCase.ejecutar();

    expect(configuracion.crearSiNoExiste).toHaveBeenCalledWith(
      expect.objectContaining({
        clave: 'flujo.cotizacion_volver_borrador_aceptada',
        valor: true,
      }),
    );
  });

  it('asegura las claves de correo de negociación a proveedores', async () => {
    configuracion.listarTodas.mockResolvedValue([] as never);

    await useCase.ejecutar();

    expect(configuracion.crearSiNoExiste).toHaveBeenCalledWith(
      expect.objectContaining({
        clave: 'pedidos_proveedor.notificar_negociacion',
        valor: true,
      }),
    );
    expect(configuracion.crearSiNoExiste).toHaveBeenCalledWith(
      expect.objectContaining({
        clave: 'pedidos_proveedor.negociacion_asunto',
      }),
    );
    expect(configuracion.crearSiNoExiste).toHaveBeenCalledWith(
      expect.objectContaining({
        clave: 'pedidos_proveedor.negociacion_cuerpo',
      }),
    );
  });

  it('no incluye smtp.port en numericas (va en sección smtp)', async () => {
    configuracion.listarTodas.mockResolvedValue([
      {
        id: 's1',
        clave: 'smtp.port',
        valor: 587,
        descripcion: null,
        esPublico: false,
      },
      {
        id: 's2',
        clave: 'smtp.host',
        valor: 'mail.test',
        descripcion: null,
        esPublico: false,
      },
    ] as never);

    const res = await useCase.ejecutar();

    expect(res.numericas).toHaveLength(0);
    expect(res.smtp.map((i) => i.clave)).toEqual(['smtp.port', 'smtp.host']);
  });
});
