import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EtapaEvento, Prisma } from '@prisma/client';
import { GenerarPedidosEventoUseCase } from './generar-pedidos-evento.use-case';
import { GenerarTareasEventoUseCase } from './generar-tareas-evento.use-case';
import { mapEventoResponse } from '../../domain/mappers/evento.mapper';
import { EventsService } from '../../../events/events.service';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { EventosRepository } from '../../infrastructure/repositories/eventos.repository';
import { PrecondicionesEventoService } from '../../domain/services/precondiciones-evento.service';
import { hayConflictoTurno } from '../../domain/utils/turno-horario';

@Injectable()
export class ConfirmarEventoUseCase {
  constructor(
    private readonly eventos: EventosRepository,
    private readonly auditoria: AuditoriaRepository,
    private readonly events: EventsService,
    private readonly generarPedidos: GenerarPedidosEventoUseCase,
    private readonly generarTareas: GenerarTareasEventoUseCase,
    private readonly precondiciones: PrecondicionesEventoService,
  ) {}

  async ejecutar(id: string) {
    const antes = await this.eventos.obtenerPorId(id);
    if (!antes) throw new NotFoundException('Evento no encontrado');
    if (antes.etapa !== EtapaEvento.por_confirmar) {
      throw new BadRequestException(
        'Solo se confirman eventos en etapa Por confirmar',
      );
    }

    await this.precondiciones.validarParaConfirmar(id);

    const ocupados = await this.eventos.listarActivosEnFecha(
      antes.fechaEvento,
      antes.zona,
      id,
    );
    const horario = antes as { horarioInicio?: string | null; horarioFin?: string | null };
    if (
      hayConflictoTurno(
        {
          turno: antes.turno,
          inicio: horario.horarioInicio,
          fin: horario.horarioFin,
        },
        ocupados.map((e) => ({
          turno: e.turno,
          inicio: e.horarioInicio,
          fin: e.horarioFin,
        })),
      )
    ) {
      throw new BadRequestException(
        'Ya existe otro evento activo en esa fecha y turno',
      );
    }

    const despues = await this.eventos.actualizar(id, {
      etapa: EtapaEvento.confirmado,
      confirmadoEn: new Date(),
    });

    await this.auditoria.registrar({
      tipoEntidad: 'evento',
      entidadId: id,
      accion: 'confirmar',
      actorTipo: 'vendedor',
      antes: JSON.parse(JSON.stringify(antes)) as Prisma.InputJsonValue,
      despues: JSON.parse(JSON.stringify(despues)) as Prisma.InputJsonValue,
    });

    this.events.eventoActualizado(id, 'Evento confirmado');

    await this.generarPedidos.ejecutar(id);
    await this.generarTareas.ejecutar(id);

    return mapEventoResponse(despues);
  }
}
