import { BadRequestException, Injectable } from '@nestjs/common';
import { EtapaContrato, EtapaPedido, TipoPedido } from '@prisma/client';
import { ContratosRepository } from '../../infrastructure/repositories/contratos.repository';
import { PedidosRepository } from '../../infrastructure/repositories/pedidos.repository';

const ETAPAS_CONTRATO_VALIDAS: EtapaContrato[] = [
  EtapaContrato.enviado,
  EtapaContrato.firmado,
];

const ETAPAS_PEDIDO_PROVEEDOR_OK: EtapaPedido[] = [
  EtapaPedido.confirmado,
  EtapaPedido.entregado,
];

@Injectable()
export class PrecondicionesEventoService {
  constructor(
    private readonly contratos: ContratosRepository,
    private readonly pedidos: PedidosRepository,
  ) {}

  async validarParaConfirmar(eventoId: string): Promise<void> {
    const contrato = await this.contratos.obtenerPorEventoId(eventoId);
    if (!contrato) {
      throw new BadRequestException(
        'Debes generar el contrato antes de confirmar el evento en la agenda.',
      );
    }
    if (
      contrato.etapa === EtapaContrato.anulado ||
      !ETAPAS_CONTRATO_VALIDAS.includes(contrato.etapa)
    ) {
      throw new BadRequestException(
        'El contrato debe estar enviado o firmado antes de programar el evento.',
      );
    }

    const pedidos = await this.pedidos.listarPorEvento(eventoId);
    const pedidosProveedor = pedidos.filter((p) => p.tipo === TipoPedido.proveedor);
    const pendientes = pedidosProveedor.filter(
      (p) =>
        p.etapa !== EtapaPedido.cancelado &&
        !ETAPAS_PEDIDO_PROVEEDOR_OK.includes(p.etapa),
    );
    if (pendientes.length > 0) {
      throw new BadRequestException(
        `Hay ${pendientes.length} pedido(s) de proveedor sin confirmar. Confírmalos antes de programar el evento.`,
      );
    }
  }
}
