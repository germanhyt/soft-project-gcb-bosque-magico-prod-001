import { BadRequestException } from '@nestjs/common';
import { CategoriaProducto, SubtipoProducto } from '@prisma/client';
import type {
  ProductoCotizacionRef,
  SeleccionPaqueteInput,
} from './composicion-paquete.types';

export function validarSeleccionPaquete(
  seleccion: SeleccionPaqueteInput,
  productos: Map<string, ProductoCotizacionRef>,
): void {
  for (const adicional of seleccion.adicionales ?? []) {
    const producto = productos.get(adicional.productoId);
    if (!producto) {
      throw new BadRequestException('Producto adicional no encontrado');
    }
    if (
      producto.categoria === CategoriaProducto.catering &&
      producto.subtipo === SubtipoProducto.general &&
      adicional.cantidad < producto.cantidadMinima
    ) {
      throw new BadRequestException(
        `${producto.nombre}: mínimo ${producto.cantidadMinima} unidades por evento`,
      );
    }
  }
}
