import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EtapaContrato, EtapaEvento, EtapaPedido, TipoPedido } from '@prisma/client';
import { CancelarEventoDto } from '../dto/cancelar-evento.dto';
import { mapEventoResponse } from '../../domain/mappers/evento.mapper';
import { NotificacionProveedorService } from '../../domain/services/notificacion-proveedor.service';
import { EventsService } from '../../../events/events.service';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { ContratosRepository } from '../../infrastructure/repositories/contratos.repository';
import { EventosRepository } from '../../infrastructure/repositories/eventos.repository';
import { PedidosRepository } from '../../infrastructure/repositories/pedidos.repository';

@Injectable()
export class CancelarEventoUseCase {
  constructor(
    private readonly eventos: EventosRepository,
    private readonly contratos: ContratosRepository,
    private readonly pedidos: PedidosRepository,
    private readonly notificacionProveedor: NotificacionProveedorService,
    private readonly auditoria: AuditoriaRepository,
    private readonly events: EventsService,
  ) {}

  async ejecutar(id: string, dto: CancelarEventoDto) {
    const antes = await this.eventos.obtenerPorId(id);
    if (!antes) throw new NotFoundException('Evento no encontrado');
    if (
      antes.etapa === EtapaEvento.realizado ||
      antes.etapa === EtapaEvento.cancelado
    ) {
      throw new BadRequestException('El evento ya está cerrado operativamente');
    }

    const notas = [
      antes.notas,
      dto.motivo ? `Cancelación: ${dto.motivo}` : undefined,
    ]
      .filter(Boolean)
      .join('\n');

    const despues = await this.eventos.actualizar(id, {
      etapa: EtapaEvento.cancelado,
      canceladoEn: new Date(),
      notas: notas || undefined,
    });

    const contrato = await this.contratos.obtenerPorEventoId(id);
    let contratoAnulado = false;
    if (contrato && contrato.etapa !== EtapaContrato.anulado) {
      await this.contratos.marcarAnulado(contrato.id);
      contratoAnulado = true;
      await this.auditoria.registrar({
        tipoEntidad: 'contrato',
        entidadId: contrato.id,
        accion: 'anular',
        actorTipo: 'vendedor',
        metadata: { eventoId: id, motivo: dto.motivo ?? null },
      });
    }

    const pedidosAbiertos = await this.pedidos.cancelarNoEntregadosPorEvento(id);
    const aNotificar = pedidosAbiertos.filter(
      (p) =>
        p.tipo === TipoPedido.proveedor &&
        (p.etapa === EtapaPedido.solicitado ||
          p.etapa === EtapaPedido.confirmado),
    );
    const notificacionesProveedor = [];
    for (const pedido of aNotificar) {
      notificacionesProveedor.push(
        await this.notificacionProveedor.notificarCancelacion(
          pedido.id,
          dto.motivo,
        ),
      );
    }

    await this.auditoria.registrar({
      tipoEntidad: 'evento',
      entidadId: id,
      accion: 'cancelar',
      actorTipo: 'vendedor',
      metadata: {
        motivo: dto.motivo,
        contratoAnulado,
        pedidosCancelados: pedidosAbiertos.length,
      },
    });

    this.events.eventoActualizado(id, 'Evento cancelado');

    return {
      ...mapEventoResponse(despues),
      contratoAnulado,
      pedidosCancelados: pedidosAbiertos.length,
      notificacionesProveedor,
    };
  }
}
