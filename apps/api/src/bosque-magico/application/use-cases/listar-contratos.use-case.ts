import { Injectable } from '@nestjs/common';
import { EtapaContrato } from '@prisma/client';
import {
  buildPaginatedMeta,
  parsePaginationQuery,
} from '../../../common/pagination';
import { mapContratoResponse } from '../../domain/mappers/contrato.mapper';
import { ContratosRepository } from '../../infrastructure/repositories/contratos.repository';

@Injectable()
export class ListarContratosUseCase {
  constructor(private readonly contratos: ContratosRepository) {}

  async ejecutar(
    etapa?: EtapaContrato,
    page?: string,
    pageSize?: string,
    q?: string,
  ) {
    const {
      page: p,
      pageSize: size,
      skip,
    } = parsePaginationQuery(page, pageSize);

    const [items, total] = await Promise.all([
      this.contratos.listar({ etapa, q, skip, take: size }),
      this.contratos.contar(etapa, q),
    ]);

    return {
      items: items.map(mapContratoResponse),
      meta: buildPaginatedMeta(total, p, size),
    };
  }
}
