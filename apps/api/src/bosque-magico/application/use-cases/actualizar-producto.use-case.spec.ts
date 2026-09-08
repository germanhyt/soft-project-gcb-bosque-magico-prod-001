import { NotFoundException } from '@nestjs/common';
import { CategoriaProducto } from '@prisma/client';
import { ActualizarProductoUseCase } from './actualizar-producto.use-case';

describe('ActualizarProductoUseCase', () => {
  const productos = {
    obtenerPorId: jest.fn(),
    actualizar: jest.fn(),
  };
  const auditoria = { registrar: jest.fn() };
  const useCase = new ActualizarProductoUseCase(
    productos as never,
    auditoria as never,
  );

  const extraPermitido = {
    id: 'prod-torta',
    codigo: 'EXT-TORTA',
    nombre: 'Torta temática',
    categoria: CategoriaProducto.extra,
    extraPermitido: true,
    precioLunesViernes: 0,
    precioFinSemana: 0,
    medios: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    productos.obtenerPorId.mockResolvedValue(extraPermitido);
    productos.actualizar.mockResolvedValue(extraPermitido);
    auditoria.registrar.mockResolvedValue(undefined);
  });

  it('persiste extraPermitido en un extra', async () => {
    await useCase.ejecutar('prod-torta', { extraPermitido: true });

    expect(productos.actualizar).toHaveBeenCalledWith(
      'prod-torta',
      expect.objectContaining({ extraPermitido: true }),
    );
  });

  it('apaga extraPermitido si deja de ser extra', async () => {
    await useCase.ejecutar('prod-torta', { categoria: CategoriaProducto.show });

    expect(productos.actualizar).toHaveBeenCalledWith(
      'prod-torta',
      expect.objectContaining({ extraPermitido: false }),
    );
  });

  it('falla si el producto no existe', async () => {
    productos.obtenerPorId.mockResolvedValue(null);

    await expect(useCase.ejecutar('x', { extraPermitido: true })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
