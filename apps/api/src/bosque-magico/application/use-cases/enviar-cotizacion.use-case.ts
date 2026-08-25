import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CanalEnvio, EtapaCotizacion, Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import {
  mapCotizacionResponse,
  type CotizacionConItems,
} from '../../domain/mappers/cotizacion.mapper';
import { EventsService } from '../../../events/events.service';
import { SolicitudCotizacionSyncService } from '../../domain/services/solicitud-cotizacion-sync.service';
import { SmtpService } from '../../domain/services/smtp.service';
import { CotizacionesRepository } from '../../infrastructure/repositories/cotizaciones.repository';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { EnviarCotizacionDto } from '../dto/enviar-cotizacion.dto';
import { TomarSolicitudUseCase } from './tomar-solicitud.use-case';

@Injectable()
export class EnviarCotizacionUseCase {
  constructor(
    private readonly cotizaciones: CotizacionesRepository,
    private readonly auditoria: AuditoriaRepository,
    private readonly config: ConfigService,
    private readonly events: EventsService,
    private readonly solicitudSync: SolicitudCotizacionSyncService,
    private readonly smtp: SmtpService,
    private readonly tomarSolicitud: TomarSolicitudUseCase,
  ) {}

  async ejecutar(
    id: string,
    dto: EnviarCotizacionDto,
    usuarioAsignadoId?: string,
  ) {
    const cot = await this.cotizaciones.obtenerPorId(id);
    if (!cot) throw new NotFoundException('Cotización no encontrada');
    if (
      cot.etapa !== EtapaCotizacion.borrador &&
      cot.etapa !== EtapaCotizacion.enviada
    ) {
      throw new BadRequestException(
        'La cotización no puede enviarse en su etapa actual',
      );
    }

    const siteUrl =
      this.config.get<string>('PUBLIC_SITE_URL') ?? 'http://localhost:5173';
    const link = `${siteUrl}/cotizacion/${cot.tokenPublico}`;
    const linkPdf = `${siteUrl}/cotizacion/${cot.tokenPublico}/pdf`;
    const destino =
      dto.canal === CanalEnvio.email
        ? (dto.correoDestino ?? cot.cliente.correo ?? '')
        : (dto.celularDestino ?? cot.cliente.celular);

    if (!destino) {
      throw new BadRequestException('Falta destino para el canal de envío');
    }

    const mensajeWhatsApp =
      `Hola ${cot.cliente.nombreCompleto}, tu cotización Bosque Mágico (${cot.codigo}) está lista.\n\n` +
      `Ver detalle y aceptar:\n${link}\n\n` +
      `Descargar PDF:\n${linkPdf}`;

    const correoAsuntoDefault = `Cotización ${cot.codigo} - Bosque Mágico`;
    const correoCuerpoDefault =
      `Hola ${cot.cliente.nombreCompleto},\n\n` +
      `Tu cotización Bosque Mágico (${cot.codigo}) está lista.\n\n` +
      `Ver detalle y aceptar:\n${link}\n\n` +
      `Descargar PDF:\n${linkPdf}\n\n` +
      `Saludos cordiales,\nEquipo Bosque Mágico`;

    const correoAsunto = dto.correoAsunto?.trim() || correoAsuntoDefault;
    const correoCuerpo = dto.correoCuerpo?.trim() || correoCuerpoDefault;

    const mensaje =
      dto.canal === CanalEnvio.whatsapp ? mensajeWhatsApp : correoCuerpo;

    let enviadoPorSmtp = false;
    if (dto.canal === CanalEnvio.email && (await this.smtp.estaActivo())) {
      await this.smtp.enviarCorreo({
        destino,
        asunto: correoAsunto,
        texto: correoCuerpo,
      });
      enviadoPorSmtp = true;
    }

    const despues = await this.cotizaciones.actualizarEtapa(id, {
      etapa: EtapaCotizacion.enviada,
      canalEnvio: dto.canal,
      enviadaEn: new Date(),
    });

    await this.cotizaciones.registrarLogEnvio({
      cotizacionId: id,
      canal: dto.canal,
      destino,
      exito: true,
      detalle: mensaje,
    });

    await this.auditoria.registrar({
      tipoEntidad: 'cotizacion',
      entidadId: id,
      accion: 'enviar',
      actorTipo: 'vendedor',
      metadata: { canal: dto.canal, destino },
    });

    await this.tomarSolicitud.ejecutarSiPendiente(
      cot.solicitudId,
      usuarioAsignadoId,
    );
    await this.solicitudSync.alEnviarCotizacion(cot.solicitudId);
    this.events.cotizacionActualizada(
      id,
      cot.codigo,
      `Enviada por ${dto.canal}`,
    );

    return {
      ...mapCotizacionResponse(despues),
      mensajePrearmado: dto.canal === CanalEnvio.whatsapp ? mensaje : undefined,
      linkPublico: link,
      linkPdfPublico: linkPdf,
      enviadoPorSmtp,
      correoAsunto: dto.canal === CanalEnvio.email ? correoAsunto : undefined,
      correoCuerpo: dto.canal === CanalEnvio.email ? correoCuerpo : undefined,
    };
  }
}
