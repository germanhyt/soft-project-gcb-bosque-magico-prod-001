import { Injectable } from '@nestjs/common';
import { CategoriaProducto } from '@prisma/client';
import { mapProductoResponse } from '../../domain/mappers/producto.mapper';
import { ProductosRepository } from '../../infrastructure/repositories/productos.repository';

@Injectable()
export class ListarProductosPanelUseCase {
  constructor(private readonly productos: ProductosRepository) {}

  async ejecutar(soloActivos?: boolean, categoria?: CategoriaProducto) {
    const lista = await this.productos.listar({ soloActivos, categoria });
    return lista.map((p) => mapProductoResponse(p));
  }
}
