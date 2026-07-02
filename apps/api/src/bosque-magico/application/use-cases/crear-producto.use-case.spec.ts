import { BadRequestException } from '@nestjs/common';
import { CategoriaProducto, SubtipoProducto } from '@prisma/client';
import { CrearProductoUseCase } from './crear-producto.use-case';

describe('CrearProductoUseCase', () => {
  const productos = {
    obtenerPorCodigo: jest.fn(),
    crear: jest.fn(),
  };
  const secuencias = {
    siguiente: jest.fn(),
  };
  const auditoria = {
    registrar: jest.fn(),
  };

  const useCase = new CrearProductoUseCase(
    productos as never,
    secuencias as never,
    auditoria as never,
  );

  const dtoBase = {
    nombre: 'Show nuevo',
    categoria: CategoriaProducto.show,
    precioLunesViernes: 200,
    precioFinSemana: 240,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    productos.crear.mockResolvedValue({
      id: 'prod-1',
      codigo: 'SHOW-001',
      nombre: 'Show nuevo',
      categoria: CategoriaProducto.show,
      precioLunesViernes: 200,
      precioFinSemana: 240,
      cantidadMinima: 1,
      etapa: 'activo',
      medios: [],
    });
    auditoria.registrar.mockResolvedValue(undefined);
  });

  it('autogenera código cuando no se envía', async () => {
    secuencias.siguiente.mockResolvedValue('SHOW-001');

    const res = await useCase.ejecutar(dtoBase);

    expect(secuencias.siguiente).toHaveBeenCalledWith('SHOW-', 3);
    expect(productos.crear).toHaveBeenCalledWith(
      expect.objectContaining({ codigo: 'SHOW-001' }),
    );
    expect(res.codigo).toBe('SHOW-001');
  });

  it('usa PIQ- para catering piqueo', async () => {
    secuencias.siguiente.mockResolvedValue('PIQ-043');

    await useCase.ejecutar({
      ...dtoBase,
      categoria: CategoriaProducto.catering,
      subtipo: SubtipoProducto.piqueo,
      unidadesPack: 25,
    });

    expect(secuencias.siguiente).toHaveBeenCalledWith('PIQ-', 3);
  });

  it('acepta código manual si no existe', async () => {
    productos.obtenerPorCodigo.mockResolvedValue(null);

    await useCase.ejecutar({ ...dtoBase, codigo: 'show-custom' });

    expect(secuencias.siguiente).not.toHaveBeenCalled();
    expect(productos.crear).toHaveBeenCalledWith(
      expect.objectContaining({ codigo: 'SHOW-CUSTOM' }),
    );
  });

  it('rechaza código manual duplicado', async () => {
    productos.obtenerPorCodigo.mockResolvedValue({ id: 'x' });

    await expect(
      useCase.ejecutar({ ...dtoBase, codigo: 'SHOW-MIMO' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
