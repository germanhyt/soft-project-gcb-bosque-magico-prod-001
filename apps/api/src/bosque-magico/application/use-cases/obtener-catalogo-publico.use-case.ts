import { Injectable } from '@nestjs/common';
import { CategoriaProducto, SubtipoProducto } from '@prisma/client';
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

    const catering = categoria(CategoriaProducto.catering);
    const piqueos = catering.filter(
      (p) => p.subtipo === SubtipoProducto.piqueo,
    );
    const cajitas = catering.filter(
      (p) => p.subtipo === SubtipoProducto.cajita,
    );
    const snacks = catering.filter((p) => p.subtipo === SubtipoProducto.snack);
    const cateringGeneral = catering.filter(
      (p) =>
        p.subtipo !== SubtipoProducto.piqueo &&
        p.subtipo !== SubtipoProducto.cajita &&
        p.subtipo !== SubtipoProducto.snack,
    );

    return {
      configuracion,
      productos: {
        paquetes: categoria(CategoriaProducto.paquete),
        shows: categoria(CategoriaProducto.show),
        catering: cateringGeneral,
        piqueos,
        cajitas,
        snacks,
        extras: categoria(CategoriaProducto.extra),
        espacios: categoria(CategoriaProducto.espacio),
      },
    };
  }
}
