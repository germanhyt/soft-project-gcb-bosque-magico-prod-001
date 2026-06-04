import { Injectable, NotFoundException } from '@nestjs/common';
import {
  mapCotizacionResponse,
  type CotizacionConItems,
} from '../../domain/mappers/cotizacion.mapper';
import { CotizacionesRepository } from '../../infrastructure/repositories/cotizaciones.repository';

@Injectable()
export class ObtenerCotizacionUseCase {
  constructor(private readonly cotizaciones: CotizacionesRepository) {}

  async ejecutar(id: string) {
    const cot = await this.cotizaciones.obtenerPorId(id);
    if (!cot) throw new NotFoundException('Cotización no encontrada');
    return mapCotizacionResponse(cot);
  }

  async ejecutarPublica(token: string) {
    const cot = await this.cotizaciones.obtenerPorToken(token);
    if (!cot) throw new NotFoundException('Cotización no encontrada');
    const mapped = mapCotizacionResponse(cot);
    const { tokenPublico: _t, ...publica } = mapped;
    return {
      ...publica,
      puedeAceptar: cot.etapa === 'enviada',
    };
  }
}
