import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EtapaSolicitud, Prisma } from '@prisma/client';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { EventsService } from '../../../events/events.service';
import { SolicitudesRepository } from '../../infrastructure/repositories/solicitudes.repository';

@Injectable()
export class TomarSolicitudUseCase {
  constructor(
    private readonly solicitudes: SolicitudesRepository,
    private readonly auditoria: AuditoriaRepository,
    private readonly events: EventsService,
  ) {}

  async ejecutar(id: string, usuarioAsignadoId?: string) {
    const antes = await this.solicitudes.obtenerPorId(id);
    if (!antes) throw new NotFoundException('Solicitud no encontrada');
    if (antes.etapa === EtapaSolicitud.cerrada) {
      throw new BadRequestException('La solicitud ya está cerrada');
    }
    if (antes.etapa !== EtapaSolicitud.nueva) {
      throw new BadRequestException(
        'Solo se pueden tomar solicitudes en etapa Nueva',
      );
    }

    const despues = await this.solicitudes.actualizar(id, {
      etapa: EtapaSolicitud.en_atencion,
      ultimoContactoEn: new Date(),
      ...(usuarioAsignadoId ? { usuarioAsignadoId } : {}),
    });

    await this.auditoria.registrar({
      tipoEntidad: 'solicitud',
      entidadId: id,
      accion: 'tomar',
      actorTipo: 'vendedor',
      antes: JSON.parse(JSON.stringify(antes)) as Prisma.InputJsonValue,
      despues: JSON.parse(JSON.stringify(despues)) as Prisma.InputJsonValue,
    });

    this.events.solicitudActualizada(
      id,
      `${antes.nombreContacto} → En atención`,
    );

    return despues;
  }
}
