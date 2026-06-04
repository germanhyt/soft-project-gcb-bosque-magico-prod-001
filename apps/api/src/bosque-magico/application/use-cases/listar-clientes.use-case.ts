import { Injectable } from '@nestjs/common';
import {
  buildPaginatedMeta,
  parsePaginationQuery,
  type PaginatedResult,
} from '../../../common/pagination';
import { mapClienteListItem } from '../../domain/mappers/cliente.mapper';
import { IdentidadContactoService } from '../../domain/services/identidad-contacto.service';
import { ClientesRepository } from '../../infrastructure/repositories/clientes.repository';

@Injectable()
export class ListarClientesUseCase {
  constructor(
    private readonly clientes: ClientesRepository,
    private readonly identidad: IdentidadContactoService,
  ) {}

  async ejecutar(page?: string, pageSize?: string, q?: string) {
    const {
      page: p,
      pageSize: size,
      skip,
    } = parsePaginationQuery(page, pageSize);
    const [rows, total] = await Promise.all([
      this.clientes.listar({ q, skip, take: size }),
      this.clientes.contar(q),
    ]);

    const items = await Promise.all(
      rows.map(async (cliente) => {
        const idResumen = await this.identidad.resolver(
          cliente.celular,
          cliente.correo,
        );
        return mapClienteListItem(cliente, idResumen);
      }),
    );

    return {
      items,
      meta: buildPaginatedMeta(total, p, size),
    } satisfies PaginatedResult<(typeof items)[number]>;
  }
}
