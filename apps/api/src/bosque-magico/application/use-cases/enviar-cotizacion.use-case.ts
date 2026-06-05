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
import { CotizacionesRepository } from '../../infrastructure/repositories/cotizaciones.repository';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { EnviarCotizacionDto } from '../dto/enviar-cotizacion.dto';

@Injectable()
export class EnviarCotizacionUseCase {
  constructor(
    private readonly cotizaciones: CotizacionesRepository,
    private readonly auditoria: AuditoriaRepository,
    private readonly config: ConfigService,
    private readonly events: EventsService,
    private readonly solicitudSync: SolicitudCotizacionSyncService,
  ) {}

  async ejecutar(id: string, dto: EnviarCotizacionDto) {
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
    const destino =
      dto.canal === CanalEnvio.email
        ? (dto.correoDestino ?? cot.cliente.correo ?? '')
        : (dto.celularDestino ?? cot.cliente.celular);

    if (!destino) {
      throw new BadRequestException('Falta destino para el canal de envío');
    }

    const mensaje =
      dto.canal === CanalEnvio.whatsapp
        ? `Hola ${cot.cliente.nombreCompleto}, tu cotización Bosque Mágico (${cot.codigo}) está lista.\n\nVer detalle y aceptar:\n${link}\n\nDesde el enlace puedes revisar el PDF en tu navegador (Imprimir → Guardar como PDF).`
        : `Cotización ${cot.codigo} - Bosque Mágico: ${link}`;

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

    await this.solicitudSync.alEnviarCotizacion(cot.solicitudId);
    this.events.cotizacionActualizada(
      id,
      cot.codigo,
      `Enviada por ${dto.canal}`,
    );

    return {
      ...mapCotizacionResponse(despues),
      mensajePrearmado: mensaje,
      linkPublico: link,
    };
  }
}
