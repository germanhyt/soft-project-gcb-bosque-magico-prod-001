import { BadRequestException, Injectable } from '@nestjs/common';
import { SmtpService } from '../../domain/services/smtp.service';
import { EnviarCorreoContactoDto } from '../dto/enviar-correo-contacto.dto';

const MAX_FILES = 5;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_BYTES = 15 * 1024 * 1024;

export type AdjuntoCorreoContacto = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Injectable()
export class EnviarCorreoContactoUseCase {
  constructor(private readonly smtp: SmtpService) {}

  async ejecutar(dto: EnviarCorreoContactoDto, adjuntos: AdjuntoCorreoContacto[] = []) {
    const destino = dto.correoDestino.trim();
    const asunto = dto.asunto.trim();
    const cuerpo = dto.cuerpo.trim();
    this.validarAdjuntos(adjuntos);

    if (!(await this.smtp.estaActivo())) {
      return {
        enviadoPorSmtp: false as const,
        correoDestino: destino,
        correoAsunto: asunto,
        correoCuerpo: cuerpo,
      };
    }

    await this.smtp.enviarCorreo({
      destino,
      asunto,
      texto: cuerpo,
      adjuntos: adjuntos.map((f) => ({
        filename: f.originalname || 'adjunto',
        content: f.buffer,
        contentType: f.mimetype,
      })),
    });

    return {
      enviadoPorSmtp: true as const,
      correoDestino: destino,
      correoAsunto: asunto,
      correoCuerpo: cuerpo,
    };
  }

  private validarAdjuntos(adjuntos: AdjuntoCorreoContacto[]) {
    if (adjuntos.length > MAX_FILES) {
      throw new BadRequestException(`Máximo ${MAX_FILES} archivos adjuntos`);
    }
    let total = 0;
    for (const f of adjuntos) {
      if (f.size > MAX_FILE_BYTES) {
        throw new BadRequestException(
          `${f.originalname || 'Archivo'} supera 5 MB`,
        );
      }
      total += f.size;
    }
    if (total > MAX_TOTAL_BYTES) {
      throw new BadRequestException('El total de adjuntos no puede superar 15 MB');
    }
  }
}
