import { Injectable, Logger } from '@nestjs/common';
import { ConfiguracionRepository } from '../../infrastructure/repositories/configuracion.repository';
import { SmtpService } from './smtp.service';

export type PostventaConfig = {
  habilitado: boolean;
  urlFormulario: string;
  asunto: string;
  cuerpo: string;
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

@Injectable()
export class PostventaService {
  private readonly logger = new Logger(PostventaService.name);

  constructor(
    private readonly configuracion: ConfiguracionRepository,
    private readonly smtp: SmtpService,
  ) {}

  async cargarConfig(): Promise<PostventaConfig> {
    const items = await this.configuracion.listarTodas();
    const map = new Map(
      items.filter((i) => i.clave.startsWith('postventa.')).map((i) => [i.clave, i.valor]),
    );
    return {
      habilitado: map.get('postventa.habilitado') === true,
      urlFormulario: texto(map.get('postventa.url_formulario')),
      asunto:
        texto(map.get('postventa.asunto')) ||
        'Cuéntanos tu experiencia en Bosque Mágico',
      cuerpo:
        texto(map.get('postventa.cuerpo')) ||
        'Hola {{cliente}},\n\nGracias por celebrar con nosotros. Nos encantaría conocer tu opinión:\n{{url}}\n\n¡Hasta pronto!\nBosque Mágico',
    };
  }

  async enviarFormulario(opts: {
    correoCliente: string | null | undefined;
    nombreCliente: string;
    codigoEvento?: string | null;
    fechaEvento?: Date | null;
  }): Promise<{ enviado: boolean; motivo?: string }> {
    const cfg = await this.cargarConfig();
    if (!cfg.habilitado) return { enviado: false, motivo: 'deshabilitado' };

    const correo = opts.correoCliente?.trim();
    if (!correo) return { enviado: false, motivo: 'sin_correo' };
    if (!cfg.urlFormulario) return { enviado: false, motivo: 'sin_url' };
    if (!(await this.smtp.estaActivo())) {
      return { enviado: false, motivo: 'smtp_inactivo' };
    }

    const fecha = opts.fechaEvento
      ? opts.fechaEvento.toLocaleDateString('es-PE', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : '';

    const vars = {
      cliente: opts.nombreCliente,
      url: cfg.urlFormulario,
      evento: opts.codigoEvento ?? '',
      fecha,
    };

    try {
      await this.smtp.enviarCorreo({
        destino: correo,
        asunto: aplicarPlantilla(cfg.asunto, vars),
        texto: aplicarPlantilla(cfg.cuerpo, vars),
      });
      return { enviado: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'error desconocido';
      this.logger.warn(`Postventa no enviada a ${correo}: ${msg}`);
      return { enviado: false, motivo: 'error_envio' };
    }
  }
}
