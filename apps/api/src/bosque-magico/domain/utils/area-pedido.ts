import { CategoriaProducto } from '@prisma/client';
import { AreaPedido } from '@prisma/client';

export function areaDesdeCategoria(categoria: CategoriaProducto): AreaPedido {
  switch (categoria) {
    case CategoriaProducto.show:
      return AreaPedido.shows;
    case CategoriaProducto.catering:
      return AreaPedido.catering;
    case CategoriaProducto.extra:
      return AreaPedido.decoracion;
    default:
      return AreaPedido.operaciones;
  }
}
