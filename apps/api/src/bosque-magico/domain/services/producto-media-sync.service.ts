import { Injectable } from '@nestjs/common';
import { TipoMediaProducto } from '@prisma/client';
import { ProductoMediaRepository } from '../../infrastructure/repositories/producto-media.repository';
import { ProductosRepository } from '../../infrastructure/repositories/productos.repository';

@Injectable()
export class ProductoMediaSyncService {
  constructor(
    private readonly productos: ProductosRepository,
    private readonly media: ProductoMediaRepository,
  ) {}

  async syncImagenUrlPrincipal(productoId: string) {
    const medios = await this.media.listarPorProducto(productoId);
    const primeraImagen =
      medios.find((m) => m.tipo === TipoMediaProducto.imagen)?.url ?? null;
    return this.productos.actualizar(productoId, { imagenUrl: primeraImagen });
  }
}
