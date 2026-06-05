import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EtapaSolicitud, Prisma } from '@prisma/client';
import { ActualizarSolicitudDto } from '../dto/actualizar-solicitud.dto';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { SolicitudesRepository } from '../../infrastructure/repositories/solicitudes.repository';

function nullableText(value?: string) {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseFechaTentativa(value?: string) {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestException('Fecha tentativa inválida');
  }
  return d;
}

@Injectable()
export class ActualizarSolicitudUseCase {
  constructor(
    private readonly solicitudes: SolicitudesRepository,
    private readonly auditoria: AuditoriaRepository,
  ) {}

  async ejecutar(id: string, dto: ActualizarSolicitudDto) {
    const antes = await this.solicitudes.obtenerPorId(id);
    if (!antes) throw new NotFoundException('Solicitud no encontrada');
    if (antes.etapa === EtapaSolicitud.cerrada) {
      throw new BadRequestException('No se puede editar una solicitud cerrada');
    }

    const esSeguimiento =
      dto.notas !== undefined ||
      dto.proximoSeguimientoEn !== undefined ||
      dto.ultimoContactoEn !== undefined;

    const esDatos =
      dto.nombreContacto !== undefined ||
      dto.celular !== undefined ||
      dto.correo !== undefined ||
      dto.fechaTentativa !== undefined ||
      dto.turnoInteres !== undefined ||
      dto.cantidadNinosEstimada !== undefined;

    const ultimoContactoEn = dto.ultimoContactoEn
      ? new Date(dto.ultimoContactoEn)
      : esSeguimiento && !esDatos
        ? new Date()
        : undefined;

    const data: Prisma.BosqueMagicoSolicitudUpdateInput = {
      ...(dto.nombreContacto !== undefined
        ? { nombreContacto: dto.nombreContacto.trim() }
        : {}),
      ...(dto.celular !== undefined ? { celular: dto.celular.trim() } : {}),
      ...(dto.correo !== undefined ? { correo: nullableText(dto.correo) } : {}),
      ...(dto.fechaTentativa !== undefined
        ? { fechaTentativa: parseFechaTentativa(dto.fechaTentativa) }
        : {}),
      ...(dto.turnoInteres !== undefined ? { turnoInteres: dto.turnoInteres } : {}),
      ...(dto.cantidadNinosEstimada !== undefined
        ? { cantidadNinosEstimada: dto.cantidadNinosEstimada }
        : {}),
      ...(dto.notas !== undefined ? { notas: dto.notas } : {}),
      ...(dto.proximoSeguimientoEn
        ? { proximoSeguimientoEn: new Date(dto.proximoSeguimientoEn) }
        : {}),
      ...(ultimoContactoEn ? { ultimoContactoEn } : {}),
    };

    if ('nombreContacto' in data && !data.nombreContacto) {
      throw new BadRequestException('Nombre de contacto es obligatorio');
    }
    if ('celular' in data && !data.celular) {
      throw new BadRequestException('Celular es obligatorio');
    }

    const despues = await this.solicitudes.actualizar(id, data);

    await this.auditoria.registrar({
      tipoEntidad: 'solicitud',
      entidadId: id,
      accion: esDatos ? 'actualizar_datos' : 'actualizar_seguimiento',
      actorTipo: 'vendedor',
      antes: JSON.parse(JSON.stringify(antes)) as Prisma.InputJsonValue,
      despues: JSON.parse(JSON.stringify(despues)) as Prisma.InputJsonValue,
    });

    return despues;
  }
}
