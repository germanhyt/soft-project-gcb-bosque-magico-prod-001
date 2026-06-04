import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TipoDocumento } from '@prisma/client';
import { ActualizarClienteDto } from '../dto/actualizar-cliente.dto';
import { ObtenerClienteUseCase } from './obtener-cliente.use-case';
import { ClientesRepository } from '../../infrastructure/repositories/clientes.repository';

function nullableText(value?: string) {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

@Injectable()
export class ActualizarClienteUseCase {
  constructor(
    private readonly clientes: ClientesRepository,
    private readonly obtener: ObtenerClienteUseCase,
  ) {}

  async ejecutar(id: string, dto: ActualizarClienteDto) {
    const existente = await this.clientes.obtenerPorId(id);
    if (!existente) throw new NotFoundException('Cliente no encontrado');

    const data = {
      ...(dto.nombreCompleto !== undefined
        ? { nombreCompleto: dto.nombreCompleto.trim() }
        : {}),
      ...(dto.celular !== undefined ? { celular: dto.celular.trim() } : {}),
      ...(dto.tipoDocumento !== undefined
        ? { tipoDocumento: dto.tipoDocumento }
        : {}),
      ...(dto.numeroDocumento !== undefined
        ? { numeroDocumento: nullableText(dto.numeroDocumento) }
        : {}),
      ...(dto.correo !== undefined ? { correo: nullableText(dto.correo) } : {}),
      ...(dto.direccion !== undefined
        ? { direccion: nullableText(dto.direccion) }
        : {}),
      ...(dto.distrito !== undefined
        ? { distrito: nullableText(dto.distrito) }
        : {}),
      ...(dto.notas !== undefined ? { notas: nullableText(dto.notas) } : {}),
    };

    if ('nombreCompleto' in data && !data.nombreCompleto) {
      throw new BadRequestException('Nombre completo es obligatorio');
    }
    if ('celular' in data && !data.celular) {
      throw new BadRequestException('Celular es obligatorio');
    }
    if (
      data.tipoDocumento === TipoDocumento.dni &&
      data.numeroDocumento &&
      data.numeroDocumento.length !== 8
    ) {
      throw new BadRequestException('DNI debe tener 8 dígitos');
    }
    if (
      data.tipoDocumento === TipoDocumento.ruc &&
      data.numeroDocumento &&
      data.numeroDocumento.length !== 11
    ) {
      throw new BadRequestException('RUC debe tener 11 dígitos');
    }

    await this.clientes.actualizar(id, data);
    return this.obtener.ejecutar(id);
  }
}
