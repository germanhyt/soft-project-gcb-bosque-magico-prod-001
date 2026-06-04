import { Injectable } from '@nestjs/common';
import { EtapaSolicitud } from '@prisma/client';
import {
  buildPaginatedMeta,
  parsePaginationQuery,
  type PaginatedResult,
} from '../../../common/pagination';
import { SolicitudesRepository } from '../../infrastructure/repositories/solicitudes.repository';

@Injectable()
export class ListarSolicitudesUseCase {
  constructor(private readonly solicitudes: SolicitudesRepository) {}

  async ejecutar(
    etapa?: EtapaSolicitud,
    page?: string,
    pageSize?: string,
    q?: string,
  ): Promise<
    PaginatedResult<
      Awaited<ReturnType<SolicitudesRepository['listar']>>[number]
    >
  > {
    const {
      page: p,
      pageSize: size,
      skip,
    } = parsePaginationQuery(page, pageSize);
    const [items, total] = await Promise.all([
      this.solicitudes.listar({ etapa, q, skip, take: size }),
      this.solicitudes.contar(etapa, q),
    ]);
    return { items, meta: buildPaginatedMeta(total, p, size) };
  }
}
