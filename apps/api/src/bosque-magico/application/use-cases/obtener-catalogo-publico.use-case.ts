import { Injectable } from '@nestjs/common';
import { CategoriaProducto } from '@prisma/client';
import { ObtenerConfiguracionPublicaUseCase } from './obtener-configuracion-publica.use-case';
import { ListarProductosUseCase } from './listar-productos.use-case';

@Injectable()
export class ObtenerCatalogoPublicoUseCase {
  constructor(
    private readonly obtenerConfiguracion: ObtenerConfiguracionPublicaUseCase,
    private readonly listarProductos: ListarProductosUseCase,
  ) {}

  async ejecutar() {
    const [configuracion, productos] = await Promise.all([
      this.obtenerConfiguracion.ejecutar(),
      this.listarProductos.ejecutar(),
    ]);

    const categoria = (tipo: CategoriaProducto) =>
      productos.filter((p) => p.categoria === tipo);

    return {
      configuracion,
      productos: {
        paquetes: categoria(CategoriaProducto.paquete),
        shows: categoria(CategoriaProducto.show),
        catering: categoria(CategoriaProducto.catering),
        extras: categoria(CategoriaProducto.extra),
        espacios: categoria(CategoriaProducto.espacio),
      },
    };
  }
}
