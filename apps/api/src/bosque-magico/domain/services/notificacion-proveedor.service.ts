import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TipoPedido, TurnoInteres } from '@prisma/client';
import { ConfiguracionRepository } from '../../infrastructure/repositories/configuracion.repository';
import { EventosRepository } from '../../infrastructure/repositories/eventos.repository';
import { PedidosRepository } from '../../infrastructure/repositories/pedidos.repository';
import { fromDecimal } from '../utils/decimal';
import { SmtpService } from './smtp.service';

export type NotificacionProveedorConfig = {
  habilitado: boolean;
  asunto: string;
  cuerpo: string;
};

export type ResultadoNotificacionProveedor = {
  enviado: boolean;
  motivo?: string;
  asunto?: string;
  cuerpo?: string;
  destino?: string;
};

type OverridesCorreo = {
  asunto?: string;
  cuerpo?: string;
};

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

function aplicarPlantilla(
  plantilla: string,
  vars: Record<string, string>,
): string {
  let out = plantilla;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`{{${key}}}`, value);
  }
  return out;
}

function formatFechaEvento(fecha: Date): string {
  return fecha.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

@Injectable()
export class NotificacionProveedorService {
  private readonly logger = new Logger(NotificacionProveedorService.name);

  constructor(
    private readonly configuracion: ConfiguracionRepository,
    private readonly eventos: EventosRepository,
    private readonly pedidos: PedidosRepository,
    private readonly smtp: SmtpService,
    private readonly config: ConfigService,
  ) {}

  async cargarConfig(): Promise<NotificacionProveedorConfig> {
    const items = await this.configuracion.listarTodas();
    const map = new Map(
      items
        .filter((i) => i.clave.startsWith('pedidos_proveedor.'))
        .map((i) => [i.clave, i.valor]),
    );
    return {
      habilitado: map.get('pedidos_proveedor.notificar_correo') === true,
      asunto:
        texto(map.get('pedidos_proveedor.asunto')) ||
        'Pedido Bosque Mágico — {{servicio}} ({{fecha}})',
      cuerpo:
        texto(map.get('pedidos_proveedor.cuerpo')) ||
        [
          'Hola {{proveedor}},',
          '',
          'Solicitud de servicio desde Bosque Mágico.',
          '',
          'Cliente: {{cliente}}',
          'Evento: {{fecha}} · {{turno}}',
          'Servicio: {{servicio}}',
          'Cantidad: {{cantidad}}',
          'Costo referencial: S/ {{costo}}',
          '{{notas}}',
          '',
          'Confirma o rechaza desde este enlace:',
          '{{link}}',
        ].join('\n'),
    };
  }

  /** Notificación automática al pasar el pedido a Solicitado (requiere config habilitada). */
  async notificarAlSolicitar(
    pedidoId: string,
  ): Promise<ResultadoNotificacionProveedor> {
    const cfg = await this.cargarConfig();
    if (!cfg.habilitado) return { enviado: false, motivo: 'deshabilitado' };
    return this.enviarCorreoInterno(pedidoId, cfg, {});
  }

  /** Envío manual desde el panel (SMTP si está activo; si no, devuelve plantilla para mailto). */
  async enviarCorreoManual(
    pedidoId: string,
    overrides: OverridesCorreo = {},
  ): Promise<ResultadoNotificacionProveedor> {
    const cfg = await this.cargarConfig();
    return this.enviarCorreoInterno(pedidoId, cfg, overrides);
  }

  /** @deprecated Usar notificarAlSolicitar */
  async notificarPedidoCreado(pedidoId: string) {
    return this.notificarAlSolicitar(pedidoId);
  }

  async notificarPedidosCreados(pedidoIds: string[]) {
    for (const id of pedidoIds) {
      await this.notificarAlSolicitar(id);
    }
  }

  private async enviarCorreoInterno(
    pedidoId: string,
    cfg: NotificacionProveedorConfig,
    overrides: OverridesCorreo,
  ): Promise<ResultadoNotificacionProveedor> {
    const preparado = await this.prepararCorreo(pedidoId, cfg, overrides);
    if ('motivo' in preparado) {
      return preparado;
    }

    const { destino, asunto, cuerpo } = preparado;
    const smtpActivo = await this.smtp.estaActivo();

    if (!smtpActivo) {
      return {
        enviado: false,
        motivo: 'smtp_inactivo',
        asunto,
        cuerpo,
        destino,
      };
    }

    try {
      await this.smtp.enviarCorreo({
        destino,
        asunto,
        texto: cuerpo,
      });
      return { enviado: true, asunto, cuerpo, destino };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'error desconocido';
      this.logger.warn(
        `Notificación proveedor no enviada (pedido ${pedidoId}): ${msg}`,
      );
      return {
        enviado: false,
        motivo: 'error_envio',
        asunto,
        cuerpo,
        destino,
      };
    }
  }

  private async prepararCorreo(
    pedidoId: string,
    cfg: NotificacionProveedorConfig,
    overrides: OverridesCorreo,
  ): Promise<
    | { destino: string; asunto: string; cuerpo: string }
    | { enviado: false; motivo: string }
  > {
    const pedido = await this.pedidos.obtenerPorId(pedidoId);
    if (!pedido || pedido.tipo !== TipoPedido.proveedor) {
      return { enviado: false, motivo: 'no_aplica' };
    }

    const correo = pedido.proveedor?.correo?.trim();
    if (!correo) return { enviado: false, motivo: 'sin_correo' };

    const evento = await this.eventos.obtenerPorId(pedido.eventoId);
    if (!evento) return { enviado: false, motivo: 'sin_evento' };

    const turnoLabel = await this.etiquetaTurno(evento.turno);
    const costo = fromDecimal(pedido.costo).toFixed(2);
    const notas = pedido.notas?.trim()
      ? `Notas: ${pedido.notas.trim()}`
      : '';
    const siteUrl =
      this.config.get<string>('PUBLIC_SITE_URL') ?? 'http://localhost:5173';
    const link = pedido.tokenPublico
      ? `${siteUrl}/pedido-proveedor/${pedido.tokenPublico}`
      : '';

    const vars = {
      proveedor: pedido.proveedor?.nombre ?? 'proveedor',
      cliente: evento.cliente.nombreCompleto,
      fecha: formatFechaEvento(evento.fechaEvento),
      turno: turnoLabel,
      servicio: pedido.nombre,
      cantidad: String(pedido.cantidad),
      costo,
      notas,
      link,
    };

    const asunto =
      overrides.asunto?.trim() || aplicarPlantilla(cfg.asunto, vars);
    const cuerpo =
      overrides.cuerpo?.trim() || aplicarPlantilla(cfg.cuerpo, vars);

    return { destino: correo, asunto, cuerpo };
  }

  private async etiquetaTurno(turno: TurnoInteres): Promise<string> {
    const item = await this.configuracion.obtenerPorClave(`turnos.${turno}`);
    if (item?.valor && typeof item.valor === 'object') {
      const v = item.valor as Record<string, unknown>;
      const etiqueta = texto(v.etiqueta);
      const horario = texto(v.horario);
      if (etiqueta && horario) return `${etiqueta} (${horario})`;
      if (etiqueta) return etiqueta;
    }
    return turno;
  }
}
