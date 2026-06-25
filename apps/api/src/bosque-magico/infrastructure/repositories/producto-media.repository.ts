import { Injectable } from '@nestjs/common';
import { TipoMediaProducto } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ProductoMediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  listarPorProducto(productoId: string) {
    return this.prisma.bosqueMagicoProductoMedia.findMany({
      where: { productoId },
      orderBy: [{ tipo: 'asc' }, { orden: 'asc' }, { creadoEn: 'asc' }],
    });
  }

  crear(data: {
    productoId: string;
    tipo: TipoMediaProducto;
    url: string;
    nombreOriginal?: string;
    mimeType?: string;
    tamanoBytes?: number;
    orden?: number;
  }) {
    return this.prisma.bosqueMagicoProductoMedia.create({ data });
  }

  obtenerPorId(id: string) {
    return this.prisma.bosqueMagicoProductoMedia.findUnique({ where: { id } });
  }

  eliminar(id: string) {
    return this.prisma.bosqueMagicoProductoMedia.delete({ where: { id } });
  }

  eliminarVideo(productoId: string) {
    return this.prisma.bosqueMagicoProductoMedia.deleteMany({
      where: { productoId, tipo: TipoMediaProducto.video },
    });
  }

  contarImagenes(productoId: string) {
    return this.prisma.bosqueMagicoProductoMedia.count({
      where: { productoId, tipo: TipoMediaProducto.imagen },
    });
  }

  siguienteOrdenImagen(productoId: string) {
    return this.contarImagenes(productoId);
  }
}
