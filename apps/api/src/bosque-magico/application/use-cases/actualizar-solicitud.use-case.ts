import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EtapaSolicitud, Prisma } from '@prisma/client';
import { ActualizarSolicitudDto } from '../dto/actualizar-solicitud.dto';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { SolicitudesRepository } from '../../infrastructure/repositories/solicitudes.repository';

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

    const ultimoContactoEn = dto.ultimoContactoEn
      ? new Date(dto.ultimoContactoEn)
      : dto.proximoSeguimientoEn || dto.notas !== undefined
        ? new Date()
        : undefined;

    const despues = await this.solicitudes.actualizar(id, {
      ...(dto.notas !== undefined ? { notas: dto.notas } : {}),
      ...(dto.proximoSeguimientoEn
        ? { proximoSeguimientoEn: new Date(dto.proximoSeguimientoEn) }
        : {}),
      ...(ultimoContactoEn ? { ultimoContactoEn } : {}),
    });

    await this.auditoria.registrar({
      tipoEntidad: 'solicitud',
      entidadId: id,
      accion: 'actualizar_seguimiento',
      actorTipo: 'vendedor',
      antes: JSON.parse(JSON.stringify(antes)) as Prisma.InputJsonValue,
      despues: JSON.parse(JSON.stringify(despues)) as Prisma.InputJsonValue,
    });

    return despues;
  }
}
