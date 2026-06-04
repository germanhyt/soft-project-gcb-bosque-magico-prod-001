import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { eliminarArchivosImagenProducto } from '../../domain/utils/producto-imagen-files';
import { mapProductoResponse } from '../../domain/mappers/producto.mapper';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { ProductosRepository } from '../../infrastructure/repositories/productos.repository';

@Injectable()
export class EliminarImagenProductoUseCase {
  constructor(
    private readonly productos: ProductosRepository,
    private readonly auditoria: AuditoriaRepository,
  ) {}

  async ejecutar(productoId: string) {
    const producto = await this.productos.obtenerPorId(productoId);
    if (!producto) throw new NotFoundException('Producto no encontrado');

    eliminarArchivosImagenProducto(productoId);
    const actualizado = await this.productos.actualizar(productoId, {
      imagenUrl: null,
    });

    await this.auditoria.registrar({
      tipoEntidad: 'producto',
      entidadId: productoId,
      accion: 'quitar_imagen',
      actorTipo: 'admin',
      metadata: {
        imagenUrlAnterior: producto.imagenUrl,
      },
    });

    return mapProductoResponse(actualizado);
  }
}
