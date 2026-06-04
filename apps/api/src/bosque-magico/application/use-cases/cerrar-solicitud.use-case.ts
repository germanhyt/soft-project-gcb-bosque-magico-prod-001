import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EtapaSolicitud, Prisma } from '@prisma/client';
import { CerrarSolicitudDto } from '../dto/cerrar-solicitud.dto';
import { motivoCierreCotizacionDesdeSolicitud } from '../../domain/utils/motivo-cierre-cotizacion';
import { EventsService } from '../../../events/events.service';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { CotizacionesRepository } from '../../infrastructure/repositories/cotizaciones.repository';
import { SolicitudesRepository } from '../../infrastructure/repositories/solicitudes.repository';

@Injectable()
export class CerrarSolicitudUseCase {
  constructor(
    private readonly solicitudes: SolicitudesRepository,
    private readonly cotizaciones: CotizacionesRepository,
    private readonly auditoria: AuditoriaRepository,
    private readonly events: EventsService,
  ) {}

  async ejecutar(id: string, dto: CerrarSolicitudDto) {
    const antes = await this.solicitudes.obtenerPorId(id);
    if (!antes) throw new NotFoundException('Solicitud no encontrada');
    if (antes.etapa === EtapaSolicitud.cerrada) {
      throw new BadRequestException('La solicitud ya está cerrada');
    }

    const notasPartes = [antes.notas, dto.notas?.trim()].filter(Boolean);
    const notas = notasPartes.length ? notasPartes.join('\n') : undefined;

    const cotizacionesCerradas =
      await this.cotizaciones.cerrarVinculadasASolicitud(
        id,
        motivoCierreCotizacionDesdeSolicitud(dto.motivoCierre),
        dto.notas,
      );

    const despues = await this.solicitudes.actualizar(id, {
      etapa: EtapaSolicitud.cerrada,
      motivoCierre: dto.motivoCierre,
      notas,
    });

    await this.auditoria.registrar({
      tipoEntidad: 'solicitud',
      entidadId: id,
      accion: 'cerrar',
      actorTipo: 'vendedor',
      antes: JSON.parse(JSON.stringify(antes)) as Prisma.InputJsonValue,
      despues: JSON.parse(JSON.stringify(despues)) as Prisma.InputJsonValue,
      metadata: {
        motivoCierre: dto.motivoCierre,
        cotizacionesCerradas: cotizacionesCerradas.map((c) => c.id),
      },
    });

    for (const cot of cotizacionesCerradas) {
      await this.auditoria.registrar({
        tipoEntidad: 'cotizacion',
        entidadId: cot.id,
        accion: 'cerrar_por_solicitud',
        actorTipo: 'vendedor',
        metadata: { solicitudId: id, motivoCierre: dto.motivoCierre },
      });
    }

    this.events.solicitudActualizada(
      id,
      `${antes.nombreContacto} → Cerrada (${dto.motivoCierre})`,
    );

    return { ...despues, cotizacionesCerradas };
  }
}
