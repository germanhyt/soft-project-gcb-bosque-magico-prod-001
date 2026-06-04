import { Injectable, NotFoundException } from '@nestjs/common';
import { mapClienteDetalle } from '../../domain/mappers/cliente.mapper';
import { IdentidadContactoService } from '../../domain/services/identidad-contacto.service';
import { ClientesRepository } from '../../infrastructure/repositories/clientes.repository';
import { SolicitudesRepository } from '../../infrastructure/repositories/solicitudes.repository';

@Injectable()
export class ObtenerClienteUseCase {
  constructor(
    private readonly clientes: ClientesRepository,
    private readonly solicitudes: SolicitudesRepository,
    private readonly identidad: IdentidadContactoService,
  ) {}

  async ejecutar(id: string) {
    const cliente = await this.clientes.obtenerPorId(id);
    if (!cliente) throw new NotFoundException('Cliente no encontrado');

    const idResumen = await this.identidad.resolver(
      cliente.celular,
      cliente.correo,
    );
    const solicitudes = await this.solicitudes.listarPorIdentidad(
      cliente.celular,
      cliente.correo ?? undefined,
      20,
    );

    return mapClienteDetalle(cliente, idResumen, solicitudes);
  }
}
