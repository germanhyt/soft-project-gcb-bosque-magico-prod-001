import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfiguracionRepository } from '../../infrastructure/repositories/configuracion.repository';

export type SmtpConfigNegocio = {
  habilitado: boolean;
  host: string;
  port: number;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
  secure: boolean;
};

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

function numero(valor: unknown, fallback: number): number {
  return typeof valor === 'number' && !Number.isNaN(valor) ? valor : fallback;
}

/** Google SMTP relay rechaza EHLO si el hostname del contenedor no es un FQDN. */
function ehloHostname(): string | undefined {
  const raw = process.env.PUBLIC_SITE_URL ?? '';
  try {
    const host = new URL(raw).hostname;
    if (host.includes('.') && host !== 'localhost') return host;
  } catch {
    /* ignore */
  }
  return undefined;
}

@Injectable()
export class SmtpService {
  constructor(private readonly configuracion: ConfiguracionRepository) {}

  async cargarConfig(): Promise<SmtpConfigNegocio> {
    const items = await this.configuracion.listarTodas();
    const map = new Map(
      items
        .filter((i) => i.clave.startsWith('smtp.'))
        .map((i) => [i.clave, i.valor]),
    );

    return {
      habilitado: map.get('smtp.habilitado') === true,
      host: texto(map.get('smtp.host')),
      port: numero(map.get('smtp.port'), 587),
      user: texto(map.get('smtp.user')),
      password: texto(map.get('smtp.password')),
      fromEmail: texto(map.get('smtp.from_email')),
      fromName: texto(map.get('smtp.from_name')) || 'Bosque Mágico',
      secure: map.get('smtp.secure') === true,
    };
  }

  /** SMTP habilitado en config y con servidor definido. */
  async estaActivo(): Promise<boolean> {
    const cfg = await this.cargarConfig();
    return cfg.habilitado && cfg.host.length > 0;
  }

  async enviarCorreo(opts: {
    destino: string;
    asunto: string;
    texto: string;
    adjuntos?: Array<{
      filename: string;
      content: Buffer;
      contentType?: string;
    }>;
  }): Promise<void> {
    const cfg = await this.cargarConfig();
    if (!cfg.habilitado) {
      throw new BadRequestException('El envío SMTP no está habilitado');
    }
    if (!cfg.host) {
      throw new BadRequestException('Falta configurar el servidor SMTP');
    }

    const from = cfg.fromEmail
      ? cfg.fromName
        ? `"${cfg.fromName}" <${cfg.fromEmail}>`
        : cfg.fromEmail
      : cfg.user || undefined;

    // Relay Google (smtp-relay.gmail.com) por IP del VPS: sin AUTH si no hay password.
    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      requireTLS: !cfg.secure && cfg.port === 587,
      name: ehloHostname(),
      auth:
        cfg.user && cfg.password
          ? { user: cfg.user, pass: cfg.password }
          : undefined,
    });

    try {
      await transporter.sendMail({
        from,
        to: opts.destino,
        subject: opts.asunto,
        text: opts.texto,
        attachments: opts.adjuntos?.map((a) => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType,
        })),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al enviar correo';
      throw new InternalServerErrorException(
        `No se pudo enviar el correo: ${msg}`,
      );
    }
  }
}
