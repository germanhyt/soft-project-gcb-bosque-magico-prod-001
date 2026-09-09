import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EtapaContrato,
  EtapaPedido,
  Prisma,
  TipoAdjuntoContrato,
  TipoPedido,
} from '@prisma/client';
import { mapContratoResponse } from '../../domain/mappers/contrato.mapper';
import { NotificacionProveedorService } from '../../domain/services/notificacion-proveedor.service';
import { EventsService } from '../../../events/events.service';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { ContratoAdjuntosRepository } from '../../infrastructure/repositories/contrato-adjuntos.repository';
import { ContratosRepository } from '../../infrastructure/repositories/contratos.repository';
import { PedidosRepository } from '../../infrastructure/repositories/pedidos.repository';

@Injectable()
export class MarcarContratoEnviadoUseCase {
  constructor(
    private readonly contratos: ContratosRepository,
    private readonly auditoria: AuditoriaRepository,
  ) {}

  async ejecutar(id: string) {
    const antes = await this.contratos.obtenerPorId(id);
    if (!antes) throw new NotFoundException('Contrato no encontrado');
    if (antes.etapa === EtapaContrato.anulado) {
      throw new BadRequestException('El contrato está anulado');
    }
    if (antes.etapa === EtapaContrato.firmado) {
      return mapContratoResponse(antes);
    }

    const despues =
      antes.etapa === EtapaContrato.enviado
        ? antes
        : await this.contratos.marcarEnviado(id);

    if (despues.id === antes.id && antes.etapa !== EtapaContrato.enviado) {
      await this.auditoria.registrar({
        tipoEntidad: 'contrato',
        entidadId: id,
        accion: 'enviar',
        actorTipo: 'vendedor',
        antes: JSON.parse(JSON.stringify(antes)) as Prisma.InputJsonValue,
        despues: JSON.parse(JSON.stringify(despues)) as Prisma.InputJsonValue,
      });
    }

    return mapContratoResponse(despues);
  }
}

@Injectable()
export class MarcarContratoFirmadoUseCase {
  constructor(
    private readonly contratos: ContratosRepository,
    private readonly adjuntos: ContratoAdjuntosRepository,
    private readonly auditoria: AuditoriaRepository,
    private readonly events: EventsService,
    private readonly pedidos: PedidosRepository,
    private readonly notificacionProveedor: NotificacionProveedorService,
  ) {}

  async ejecutar(id: string) {
    const antes = await this.contratos.obtenerPorId(id);
    if (!antes) throw new NotFoundException('Contrato no encontrado');
    if (antes.etapa === EtapaContrato.anulado) {
      throw new BadRequestException('El contrato está anulado');
    }
    if (antes.etapa === EtapaContrato.firmado) {
      return {
        ...mapContratoResponse(antes),
        solicitarAutomatico: { pedidos: 0, notificaciones: [] },
      };
    }

    const [firmaCliente, firmaEmpresa] = await Promise.all([
      this.adjuntos.obtenerPorContratoYTipo(
        id,
        TipoAdjuntoContrato.firma_cliente,
      ),
      this.adjuntos.obtenerPorContratoYTipo(
        id,
        TipoAdjuntoContrato.firma_empresa,
      ),
    ]);
    if (!firmaCliente || !firmaEmpresa) {
      throw new BadRequestException(
        'Debes cargar firma del cliente y firma de Bosque Mágico antes de marcar firmado.',
      );
    }

    const despues = await this.contratos.marcarFirmado(id);

    await this.auditoria.registrar({
      tipoEntidad: 'contrato',
      entidadId: id,
      accion: 'firmar',
      actorTipo: 'vendedor',
      antes: JSON.parse(JSON.stringify(antes)) as Prisma.InputJsonValue,
      despues: JSON.parse(JSON.stringify(despues)) as Prisma.InputJsonValue,
    });

    this.events.eventoActualizado(
      antes.eventoId,
      `Contrato ${antes.numero} firmado`,
    );

    const cfg = await this.notificacionProveedor.cargarConfig();
    const solicitarAutomatico = {
      pedidos: 0,
      notificaciones: [] as Awaited<
        ReturnType<NotificacionProveedorService['notificarAlSolicitar']>
      >[],
    };

    const [pendientes, confirmados] = await Promise.all([
      this.pedidos.listarProveedorPorEventoYEtapa(antes.eventoId, [
        EtapaPedido.pendiente,
      ]),
      this.pedidos.listarProveedorPorEventoYEtapa(antes.eventoId, [
        EtapaPedido.confirmado,
      ]),
    ]);

    for (const pedido of pendientes) {
      if (pedido.tipo !== TipoPedido.proveedor) continue;
      await this.pedidos.actualizar(pedido.id, {
        etapa: EtapaPedido.solicitado,
      });
      solicitarAutomatico.pedidos += 1;
      if (cfg.habilitado) {
        solicitarAutomatico.notificaciones.push(
          await this.notificacionProveedor.notificarAlSolicitar(pedido.id, {
            estadoContrato:
              'El contrato ya está firmado; este es el pedido formal. El evento se realizará.',
          }),
        );
      }
    }

    if (cfg.habilitado) {
      for (const pedido of confirmados) {
        if (pedido.tipo !== TipoPedido.proveedor) continue;
        solicitarAutomatico.notificaciones.push(
          await this.notificacionProveedor.notificarAlSolicitar(pedido.id, {
            estadoContrato:
              'El contrato ya está firmado; el evento se realizará. Gracias por confirmar.',
          }),
        );
      }
    }

    return {
      ...mapContratoResponse(despues),
      solicitarAutomatico,
    };
  }
}
