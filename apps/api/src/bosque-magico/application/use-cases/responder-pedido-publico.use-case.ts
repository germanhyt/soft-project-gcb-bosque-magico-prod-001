import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EtapaPedido, Prisma, TipoPedido } from '@prisma/client';
import { RechazarPedidoPublicoDto } from '../dto/rechazar-pedido-publico.dto';
import { mapPedidoPublicoResponse } from '../../domain/mappers/pedido.mapper';
import { EventsService } from '../../../events/events.service';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { PedidosRepository } from '../../infrastructure/repositories/pedidos.repository';

const ETAPAS_RESPONDER: EtapaPedido[] = [
  EtapaPedido.pendiente,
  EtapaPedido.solicitado,
];

@Injectable()
export class ResponderPedidoPublicoUseCase {
  constructor(
    private readonly pedidos: PedidosRepository,
    private readonly auditoria: AuditoriaRepository,
    private readonly events: EventsService,
  ) {}

  async confirmar(token: string) {
    return this.responder(token, 'confirmar');
  }

  async rechazar(token: string, dto: RechazarPedidoPublicoDto) {
    return this.responder(token, 'rechazar', dto.motivo?.trim());
  }

  private async responder(
    token: string,
    accion: 'confirmar' | 'rechazar',
    motivo?: string,
  ) {
    const antes = await this.pedidos.obtenerPorToken(token);
    if (!antes || antes.tipo !== TipoPedido.proveedor) {
      throw new NotFoundException('Pedido no disponible');
    }
    if (!ETAPAS_RESPONDER.includes(antes.etapa)) {
      throw new BadRequestException(
        'Este pedido ya fue respondido o no admite cambios por enlace público',
      );
    }

    const nuevaEtapa =
      accion === 'confirmar' ? EtapaPedido.confirmado : EtapaPedido.cancelado;
    const notas =
      accion === 'rechazar' && motivo
        ? [antes.notas?.trim(), `Rechazo proveedor: ${motivo}`]
            .filter(Boolean)
            .join('\n')
        : antes.notas;

    const despues = await this.pedidos.actualizar(antes.id, {
      etapa: nuevaEtapa,
      ...(notas !== antes.notas ? { notas } : {}),
    });

    await this.auditoria.registrar({
      tipoEntidad: 'pedido',
      entidadId: antes.id,
      accion: accion === 'confirmar' ? 'proveedor_confirmo' : 'proveedor_rechazo',
      actorTipo: 'proveedor',
      antes: JSON.parse(JSON.stringify(antes)) as Prisma.InputJsonValue,
      despues: JSON.parse(JSON.stringify(despues)) as Prisma.InputJsonValue,
      metadata: motivo ? { motivo } : undefined,
    });

    this.events.eventoActualizado(
      antes.eventoId,
      accion === 'confirmar'
        ? 'Proveedor confirmó pedido'
        : 'Proveedor rechazó pedido',
    );

    const publico = await this.pedidos.obtenerPorToken(token);
    if (!publico) throw new NotFoundException('Pedido no disponible');

    return {
      mensaje:
        accion === 'confirmar'
          ? 'Disponibilidad confirmada. Gracias.'
          : 'Rechazo registrado. El equipo de Bosque Mágico será notificado.',
      pedido: mapPedidoPublicoResponse(publico),
    };
  }
}
