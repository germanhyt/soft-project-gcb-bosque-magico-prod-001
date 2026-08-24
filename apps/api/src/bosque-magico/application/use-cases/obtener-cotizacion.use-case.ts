import { Injectable, NotFoundException } from '@nestjs/common';
import {
  mapCotizacionResponse,
  type CotizacionConItems,
  type ProductoPackInfo,
} from '../../domain/mappers/cotizacion.mapper';
import { CotizacionesRepository } from '../../infrastructure/repositories/cotizaciones.repository';
import { ProductosRepository } from '../../infrastructure/repositories/productos.repository';

@Injectable()
export class ObtenerCotizacionUseCase {
  constructor(
    private readonly cotizaciones: CotizacionesRepository,
    private readonly productos: ProductosRepository,
  ) {}

  private async buildProductosMap(): Promise<Map<string, ProductoPackInfo>> {
    const lista = await this.productos.listar();
    const map = new Map<string, ProductoPackInfo>();
    for (const p of lista) {
      map.set(p.id, {
        id: p.id,
        subtipo: p.subtipo,
        unidadesPack: p.unidadesPack,
      });
    }
    return map;
  }

  async ejecuteConProductosMap(cot: CotizacionConItems) {
    const productosMap = await this.buildProductosMap();
    return mapCotizacionResponse(cot, productosMap);
  }

  async ejecutar(id: string) {
    const cot = await this.cotizaciones.obtenerPorId(id);
    if (!cot) throw new NotFoundException('Cotización no encontrada');
    return this.ejecuteConProductosMap(cot);
  }

  async ejecutarPublica(token: string) {
    const cot = await this.cotizaciones.obtenerPorToken(token);
    if (!cot) throw new NotFoundException('Cotización no encontrada');
    const mapped = await this.ejecuteConProductosMap(cot);
    const { tokenPublico: _t, ...publica } = mapped;
    return {
      ...publica,
      puedeAceptar: cot.etapa === 'enviada',
    };
  }
}
