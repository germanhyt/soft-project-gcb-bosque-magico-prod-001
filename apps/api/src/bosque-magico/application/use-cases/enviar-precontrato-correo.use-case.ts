import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mapCotizacionResponse } from '../../domain/mappers/cotizacion.mapper';
import { SmtpService } from '../../domain/services/smtp.service';
import { parsePrecontrato, puedeEntregarPrecontrato } from '../../domain/utils/precontrato';
import { CotizacionesRepository } from '../../infrastructure/repositories/cotizaciones.repository';
import { EnviarPrecontratoCorreoDto } from '../dto/enviar-precontrato-correo.dto';

@Injectable()
export class EnviarPrecontratoCorreoUseCase {
  constructor(
    private readonly cotizaciones: CotizacionesRepository,
    private readonly smtp: SmtpService,
    private readonly config: ConfigService,
  ) {}

  async ejecutar(id: string, dto: EnviarPrecontratoCorreoDto) {
    const cot = await this.cotizaciones.obtenerPorId(id);
    if (!cot) throw new NotFoundException('Cotización no encontrada');
    if (!puedeEntregarPrecontrato(cot.etapa)) {
      throw new BadRequestException(
        'El precontrato se envía con la cotización en borrador o enviada',
      );
    }
    if (!parsePrecontrato(cot.precontrato)) {
      throw new BadRequestException('Primero guarda el adelanto del precontrato');
    }

    const destino = (dto.correoDestino?.trim() || cot.cliente?.correo || '').trim();
    if (!destino) {
      throw new BadRequestException('Falta correo del cliente');
    }

    const siteUrl =
      this.config.get<string>('PUBLIC_SITE_URL') ?? 'http://localhost:5173';
    const link = `${siteUrl}/cotizacion/${cot.tokenPublico}/precontrato`;
    const nombre = cot.cliente?.nombreCompleto?.trim() || 'cliente';
    const correoAsunto =
      dto.correoAsunto?.trim() || `Precontrato de reserva ${cot.codigo} - Bosque Mágico`;
    const correoCuerpo =
      dto.correoCuerpo?.trim() ||
      `Hola ${nombre},\n\n` +
        `Te compartimos el precontrato de reserva de Bosque Mágico (${cot.codigo}).\n\n` +
        `La reserva queda sujeta al pago del adelanto. No confirma el evento.\n\n` +
        `Ver documento:\n${link}\n\n` +
        `Saludos cordiales,\nEquipo Bosque Mágico`;

    let enviadoPorSmtp = false;
    if (await this.smtp.estaActivo()) {
      await this.smtp.enviarCorreo({
        destino,
        asunto: correoAsunto,
        texto: correoCuerpo,
      });
      enviadoPorSmtp = true;
    }

    return {
      ...mapCotizacionResponse(cot),
      enviadoPorSmtp,
      correoDestino: destino,
      correoAsunto,
      correoCuerpo,
    };
  }
}
