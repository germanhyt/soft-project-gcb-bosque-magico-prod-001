import { Injectable, Logger } from '@nestjs/common';
import { EtapaEvento } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { ConfiguracionRepository } from '../../infrastructure/repositories/configuracion.repository';
import { EventosRepository } from '../../infrastructure/repositories/eventos.repository';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { EventsService } from '../../../events/events.service';
import { SmtpService } from './smtp.service';
import {
  claveFechaCalendario,
  fechaCalendarioHoy,
  inicioDiaCalendarioUtc,
} from '../utils/fecha-calendario';

export type RecordatorioConfig = {
  habilitado: boolean;
  diasAntes: number;
  correoOperador: string;
  asuntoCliente: string;
  cuerpoCliente: string;
  asuntoOperador: string;
  cuerpoOperador: string;
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

function sumarDiasCalendario(fecha: string, dias: number): string {
  const d = inicioDiaCalendarioUtc(fecha);
  d.setUTCDate(d.getUTCDate() + dias);
  return claveFechaCalendario(d);
}

function formatearFechaLarga(fecha: Date): string {
  return fecha.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

const ACCION_AUDITORIA = 'recordatorio_evento';

@Injectable()
export class RecordatorioEventoService {
  private readonly logger = new Logger(RecordatorioEventoService.name);

  constructor(
    private readonly configuracion: ConfiguracionRepository,
    private readonly eventos: EventosRepository,
    private readonly auditoria: AuditoriaRepository,
    private readonly smtp: SmtpService,
    private readonly events: EventsService,
    private readonly config: ConfigService,
  ) {}

  async cargarConfig(): Promise<RecordatorioConfig> {
    const items = await this.configuracion.listarTodas();
    const map = new Map(
      items
        .filter((i) => i.clave.startsWith('recordatorios.'))
        .map((i) => [i.clave, i.valor]),
    );
    const diasRaw = map.get('recordatorios.dias_antes');
    const diasAntes =
      typeof diasRaw === 'number' && !Number.isNaN(diasRaw) && diasRaw >= 0
        ? Math.floor(diasRaw)
        : 7;

    return {
      habilitado: map.get('recordatorios.habilitado') === true,
      diasAntes,
      correoOperador: texto(map.get('recordatorios.correo_operador')),
      asuntoCliente:
        texto(map.get('recordatorios.asunto_cliente')) ||
        'Recordatorio: tu evento en Bosque Mágico ({{fecha}})',
      cuerpoCliente:
        texto(map.get('recordatorios.cuerpo_cliente')) ||
        'Hola {{cliente}},\n\nTe recordamos que tu evento en Bosque Mágico es el {{fecha}} ({{turno}}).\nCumpleañero: {{cumpleanero}}\nPaquete: {{paquete}}\n\n¡Te esperamos!\nEquipo Bosque Mágico',
      asuntoOperador:
        texto(map.get('recordatorios.asunto_operador')) ||
        'Recordatorio operativo — {{cliente}} ({{fecha}})',
      cuerpoOperador:
        texto(map.get('recordatorios.cuerpo_operador')) ||
        'Recordatorio de evento:\n\nCliente: {{cliente}}\nCorreo: {{correoCliente}}\nCelular: {{celular}}\nFecha: {{fecha}} · {{turno}}\nEstado: {{etapa}}\nPaquete: {{paquete}}\nCumpleañero: {{cumpleanero}}\nEvento ID: {{eventoId}}',
    };
  }

  private destinoOperador(cfg: RecordatorioConfig): string | null {
    if (cfg.correoOperador) return cfg.correoOperador;
    const admin = this.config.get<string>('ADMIN_EMAIL')?.trim();
    return admin || null;
  }

  async procesarVentana(ahora = new Date()): Promise<{
    habilitado: boolean;
    diasAntes: number;
    fechaObjetivo: string;
    revisados: number;
    enviados: number;
    omitidos: number;
    detalles: Array<{
      eventoId: string;
      cliente: boolean;
      operador: boolean;
      panel: boolean;
      motivo?: string;
    }>;
  }> {
    const cfg = await this.cargarConfig();
    const hoy = fechaCalendarioHoy();
    const fechaObjetivo = sumarDiasCalendario(hoy, cfg.diasAntes);

    if (!cfg.habilitado) {
      return {
        habilitado: false,
        diasAntes: cfg.diasAntes,
        fechaObjetivo,
        revisados: 0,
        enviados: 0,
        omitidos: 0,
        detalles: [],
      };
    }

    const eventos = await this.eventos.listarEnFecha(fechaObjetivo, [
      EtapaEvento.por_confirmar,
      EtapaEvento.confirmado,
    ]);

    const smtpActivo = await this.smtp.estaActivo();
    const destinoOp = this.destinoOperador(cfg);
    const ventana = `dias:${cfg.diasAntes}`;
    const detalles: Array<{
      eventoId: string;
      cliente: boolean;
      operador: boolean;
      panel: boolean;
      motivo?: string;
    }> = [];

    let enviados = 0;
    let omitidos = 0;

    for (const evento of eventos) {
      const ya = await this.auditoria.existeAccion(
        'evento',
        evento.id,
        ACCION_AUDITORIA,
        { ventana },
      );
      if (ya) {
        omitidos += 1;
        detalles.push({
          eventoId: evento.id,
          cliente: false,
          operador: false,
          panel: false,
          motivo: 'ya_enviado',
        });
        continue;
      }

      const turnoLabel = await this.etiquetaTurno(evento.turno);
      const fechaStr = formatearFechaLarga(evento.fechaEvento);
      const vars = {
        cliente: evento.cliente.nombreCompleto,
        correoCliente: evento.cliente.correo?.trim() || 'Sin correo',
        celular: evento.cliente.celular,
        fecha: fechaStr,
        turno: turnoLabel,
        etapa: evento.etapa,
        paquete: evento.cotizacion?.paquete ?? '',
        cumpleanero: evento.cumpleanero?.nombre ?? '',
        eventoId: evento.id,
        diasAntes: String(cfg.diasAntes),
      };

      let clienteOk = false;
      let operadorOk = false;
      let panelOk = false;
      let motivo: string | undefined;

      if (smtpActivo) {
        const correoCliente = evento.cliente.correo?.trim();
        if (correoCliente) {
          try {
            await this.smtp.enviarCorreo({
              destino: correoCliente,
              asunto: aplicarPlantilla(cfg.asuntoCliente, vars),
              texto: aplicarPlantilla(cfg.cuerpoCliente, vars),
            });
            clienteOk = true;
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'error';
            this.logger.warn(
              `Recordatorio cliente falló (${evento.id}): ${msg}`,
            );
            motivo = 'error_cliente';
          }
        } else {
          motivo = 'sin_correo_cliente';
        }

        if (destinoOp) {
          try {
            await this.smtp.enviarCorreo({
              destino: destinoOp,
              asunto: aplicarPlantilla(cfg.asuntoOperador, vars),
              texto: aplicarPlantilla(cfg.cuerpoOperador, vars),
            });
            operadorOk = true;
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'error';
            this.logger.warn(
              `Recordatorio operador falló (${evento.id}): ${msg}`,
            );
            motivo = motivo ?? 'error_operador';
          }
        } else {
          motivo = motivo ?? 'sin_correo_operador';
        }
      } else {
        motivo = 'smtp_inactivo';
      }

      try {
        this.events.eventoRecordatorio(
          evento.id,
          `${evento.cliente.nombreCompleto} · ${fechaStr} · ${turnoLabel} (faltan ${cfg.diasAntes} día(s))`,
        );
        panelOk = true;
      } catch (err) {
        this.logger.warn(
          `Notificación panel recordatorio falló (${evento.id})`,
          err,
        );
      }

      await this.auditoria.registrar({
        tipoEntidad: 'evento',
        entidadId: evento.id,
        accion: ACCION_AUDITORIA,
        actorTipo: 'sistema',
        metadata: {
          ventana,
          fechaObjetivo,
          diasAntes: cfg.diasAntes,
          canales: {
            cliente: clienteOk,
            operador: operadorOk,
            panel: panelOk,
          },
          motivo,
          procesadoEn: ahora.toISOString(),
        },
      });

      enviados += 1;
      detalles.push({
        eventoId: evento.id,
        cliente: clienteOk,
        operador: operadorOk,
        panel: panelOk,
        motivo,
      });
    }

    this.logger.log(
      `Recordatorios ${fechaObjetivo}: revisados=${eventos.length} enviados=${enviados} omitidos=${omitidos}`,
    );

    return {
      habilitado: true,
      diasAntes: cfg.diasAntes,
      fechaObjetivo,
      revisados: eventos.length,
      enviados,
      omitidos,
      detalles,
    };
  }

  private async etiquetaTurno(turno: string): Promise<string> {
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
