import { Injectable } from '@nestjs/common';
import { SmtpService } from '../../domain/services/smtp.service';
import { ProbarSmtpDto } from '../dto/probar-smtp.dto';

@Injectable()
export class ProbarSmtpUseCase {
  constructor(private readonly smtp: SmtpService) {}

  async ejecutar(dto: ProbarSmtpDto) {
    const destino = dto.correoDestino.trim();
    await this.smtp.enviarCorreo({
      destino,
      asunto: 'Prueba SMTP — Bosque Mágico',
      texto:
        'Este es un correo de prueba enviado desde Configuración del panel Bosque Mágico.\n\n' +
        'Si lo recibiste, el envío SMTP está funcionando correctamente.',
    });
    return { ok: true as const, destino };
  }
}
