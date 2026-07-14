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

  /**
   * Toma la solicitud si sigue en Nueva (sin error si ya fue tomada).
   * Si ya está en gestión y no tiene asignado, solo completa usuarioAsignadoId.
   */
  async ejecutarSiPendiente(
    id: string | null | undefined,
    usuarioAsignadoId?: string,
  ) {
    if (!id) return null;
    const antes = await this.solicitudes.obtenerPorId(id);
    if (!antes || antes.etapa === EtapaSolicitud.cerrada) return null;

    if (antes.etapa === EtapaSolicitud.nueva) {
      return this.ejecutar(id, usuarioAsignadoId);
    }

    if (usuarioAsignadoId && !antes.usuarioAsignadoId) {
      return this.solicitudes.actualizar(id, { usuarioAsignadoId });
    }

    return null;
  }
}
