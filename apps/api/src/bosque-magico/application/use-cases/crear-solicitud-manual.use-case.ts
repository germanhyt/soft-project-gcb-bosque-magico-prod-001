import { Injectable } from '@nestjs/common';
import { CanalSolicitud, EtapaSolicitud, Prisma } from '@prisma/client';
import { CrearSolicitudManualDto } from '../dto/crear-solicitud-manual.dto';
import { EventsService } from '../../../events/events.service';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { SolicitudesRepository } from '../../infrastructure/repositories/solicitudes.repository';
import { AnticipacionEventoService } from '../../domain/services/anticipacion-evento.service';
import { CapacidadEventoService } from '../../domain/services/capacidad-evento.service';

@Injectable()
export class CrearSolicitudManualUseCase {
  constructor(
    private readonly solicitudes: SolicitudesRepository,
    private readonly auditoria: AuditoriaRepository,
    private readonly events: EventsService,
    private readonly anticipacion: AnticipacionEventoService,
    private readonly capacidad: CapacidadEventoService,
  ) {}

  async ejecutar(dto: CrearSolicitudManualDto) {
    if (dto.fechaTentativa) {
      await this.anticipacion.validar(dto.fechaTentativa);
    }
    await this.capacidad.validar(dto.cantidadNinosEstimada);
    const etapa =
      dto.etapaInicial === EtapaSolicitud.en_atencion
        ? EtapaSolicitud.en_atencion
        : EtapaSolicitud.nueva;

    const solicitud = await this.solicitudes.crear({
      nombreContacto: dto.nombreContacto,
      celular: dto.celular,
      correo: dto.correo,
      canal: dto.canal ?? CanalSolicitud.manual,
      detalleOrigen: 'panel_manual',
      fechaTentativa: dto.fechaTentativa
        ? new Date(dto.fechaTentativa)
        : undefined,
      turnoInteres: dto.turnoInteres,
      cantidadNinosEstimada: dto.cantidadNinosEstimada,
      notas: dto.notas,
      payloadOrigen: { origen: 'panel_manual' },
    });

    if (etapa === EtapaSolicitud.en_atencion) {
      await this.solicitudes.actualizar(solicitud.id, {
        etapa: EtapaSolicitud.en_atencion,
      });
    }

    const final = await this.solicitudes.obtenerPorId(solicitud.id);

    await this.auditoria.registrar({
      tipoEntidad: 'solicitud',
      entidadId: solicitud.id,
      accion: 'crear_manual',
      actorTipo: 'vendedor',
      despues: JSON.parse(JSON.stringify(final)) as Prisma.InputJsonValue,
    });

    this.events.solicitudNueva(solicitud.id, dto.nombreContacto);

    return final!;
  }
}
