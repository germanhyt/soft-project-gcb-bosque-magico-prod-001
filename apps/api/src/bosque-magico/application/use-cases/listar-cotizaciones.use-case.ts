import { Injectable } from '@nestjs/common';
import { EtapaCotizacion } from '@prisma/client';
import {
  buildPaginatedMeta,
  parsePaginationQuery,
  type PaginatedResult,
} from '../../../common/pagination';
import {
  mapCotizacionResponse,
  type CotizacionConItems,
} from '../../domain/mappers/cotizacion.mapper';
import { CotizacionesRepository } from '../../infrastructure/repositories/cotizaciones.repository';

@Injectable()
export class ListarCotizacionesUseCase {
  constructor(private readonly cotizaciones: CotizacionesRepository) {}

  async ejecutar(
    etapa?: EtapaCotizacion,
    page?: string,
    pageSize?: string,
    q?: string,
  ): Promise<PaginatedResult<ReturnType<typeof mapCotizacionResponse>>> {
    const {
      page: p,
      pageSize: size,
      skip,
    } = parsePaginationQuery(page, pageSize);
    const [lista, total] = await Promise.all([
      this.cotizaciones.listar({ etapa, q, skip, take: size }),
      this.cotizaciones.contar(etapa, q),
    ]);
    return {
      items: lista.map((c) => mapCotizacionResponse(c as CotizacionConItems)),
      meta: buildPaginatedMeta(total, p, size),
    };
  }
}
