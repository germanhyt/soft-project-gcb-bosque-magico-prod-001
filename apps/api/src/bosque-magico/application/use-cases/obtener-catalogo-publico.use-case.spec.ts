import { CategoriaProducto } from '@prisma/client';
import { ObtenerCatalogoPublicoUseCase } from './obtener-catalogo-publico.use-case';

describe('ObtenerCatalogoPublicoUseCase', () => {
  const obtenerConfiguracion = { ejecutar: jest.fn() };
  const listarProductos = { ejecutar: jest.fn() };
  const useCase = new ObtenerCatalogoPublicoUseCase(
    obtenerConfiguracion as never,
    listarProductos as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    obtenerConfiguracion.ejecutar.mockResolvedValue({ turnos: [] });
  });

  it('excluye extras permitidos del catálogo público cobrable', async () => {
    listarProductos.ejecutar.mockResolvedValue([
      {
        id: '1',
        codigo: 'EXT-PINTA',
        nombre: 'Pintacaritas',
        categoria: CategoriaProducto.extra,
        extraPermitido: false,
      },
      {
        id: '2',
        codigo: 'EXT-PINATA',
        nombre: 'Piñata',
        categoria: CategoriaProducto.extra,
      },
      {
        id: '3',
        codigo: 'EXT-TORTA',
        nombre: 'Torta temática',
        categoria: CategoriaProducto.extra,
        extraPermitido: true,
      },
    ]);

    const res = await useCase.ejecutar();

    expect(res.productos.extras.map((p: { codigo: string }) => p.codigo)).toEqual(
      ['EXT-PINTA'],
    );
  });
});
