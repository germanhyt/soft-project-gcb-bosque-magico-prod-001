import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as fs from 'node:fs';
import {
  directorioImagenesProductos,
  eliminarArchivosImagenProducto,
} from '../../domain/utils/producto-imagen-files';
import { mapProductoResponse } from '../../domain/mappers/producto.mapper';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { ProductosRepository } from '../../infrastructure/repositories/productos.repository';

const MIME_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

@Injectable()
export class SubirImagenProductoUseCase {
  constructor(
    private readonly productos: ProductosRepository,
    private readonly auditoria: AuditoriaRepository,
  ) {}

  async ejecutar(productoId: string, file: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Archivo de imagen requerido');
    }
    const ext = MIME_EXT[file.mimetype];
    if (!ext) {
      throw new BadRequestException(
        'Formato no permitido. Use JPG, PNG o WebP.',
      );
    }
    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException('La imagen no debe superar 2 MB');
    }

    const producto = await this.productos.obtenerPorId(productoId);
    if (!producto) throw new NotFoundException('Producto no encontrado');

    const dir = directorioImagenesProductos();
    fs.mkdirSync(dir, { recursive: true });

    const filename = `${productoId}${ext}`;
    const filepath = `${dir}/${filename}`;
    eliminarArchivosImagenProducto(productoId);
    fs.writeFileSync(filepath, file.buffer);

    const imagenUrl = `/api/uploads/productos/${filename}`;
    const actualizado = await this.productos.actualizar(productoId, {
      imagenUrl,
    });

    await this.auditoria.registrar({
      tipoEntidad: 'producto',
      entidadId: productoId,
      accion: 'actualizar',
      actorTipo: 'admin',
      metadata: { imagenUrl },
    });

    return mapProductoResponse(actualizado);
  }
}
