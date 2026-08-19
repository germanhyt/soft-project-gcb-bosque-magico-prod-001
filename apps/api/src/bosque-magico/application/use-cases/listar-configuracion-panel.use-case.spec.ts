import { ListarConfiguracionPanelUseCase } from './listar-configuracion-panel.use-case';
import { ConfiguracionRepository } from '../../infrastructure/repositories/configuracion.repository';

describe('ListarConfiguracionPanelUseCase', () => {
  let useCase: ListarConfiguracionPanelUseCase;
  let configuracion: jest.Mocked<Pick<ConfiguracionRepository, 'listarTodas'>>;

  beforeEach(() => {
    configuracion = { listarTodas: jest.fn() };
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

  it('no incluye smtp.port en numericas (va en sección smtp)', async () => {
    configuracion.listarTodas.mockResolvedValue([
      { id: 's1', clave: 'smtp.port', valor: 587, descripcion: null, esPublico: false },
      { id: 's2', clave: 'smtp.host', valor: 'mail.test', descripcion: null, esPublico: false },
    ] as never);

    const res = await useCase.ejecutar();

    expect(res.numericas).toHaveLength(0);
    expect(res.smtp.map((i) => i.clave)).toEqual(['smtp.port', 'smtp.host']);
  });
});
