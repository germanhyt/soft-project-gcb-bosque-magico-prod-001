import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EtapaContrato } from '@prisma/client';
import { SmtpService } from '../../domain/services/smtp.service';
import { ContratosRepository } from '../../infrastructure/repositories/contratos.repository';
import { EnviarContratoCorreoDto } from '../dto/enviar-contrato-correo.dto';
import { MarcarContratoEnviadoUseCase } from './marcar-contrato-estado.use-case';

type SnapshotCliente = {
  cliente?: {
    correo?: string | null;
    nombreCompleto?: string | null;
  };
};

function correoDesdeSnapshot(snapshot: unknown): string {
  if (!snapshot || typeof snapshot !== 'object') return '';
  const correo = (snapshot as SnapshotCliente).cliente?.correo;
  return typeof correo === 'string' ? correo.trim() : '';
}

function nombreDesdeSnapshot(snapshot: unknown): string {
  if (!snapshot || typeof snapshot !== 'object') return 'cliente';
  const nombre = (snapshot as SnapshotCliente).cliente?.nombreCompleto;
  return typeof nombre === 'string' && nombre.trim() ? nombre.trim() : 'cliente';
}

@Injectable()
export class EnviarContratoCorreoUseCase {
  constructor(
    private readonly contratos: ContratosRepository,
    private readonly marcarEnviado: MarcarContratoEnviadoUseCase,
    private readonly smtp: SmtpService,
    private readonly config: ConfigService,
  ) {}

  async ejecutar(id: string, dto: EnviarContratoCorreoDto) {
    const contrato = await this.contratos.obtenerPorId(id);
    if (!contrato) throw new NotFoundException('Contrato no encontrado');
    if (contrato.etapa === EtapaContrato.anulado) {
      throw new BadRequestException('El contrato está anulado');
    }
    if (contrato.etapa === EtapaContrato.firmado) {
      throw new BadRequestException(
        'El contrato ya está firmado; no se reenvía por este flujo',
      );
    }

    const destino = (dto.correoDestino?.trim() || correoDesdeSnapshot(contrato.snapshotJson)).trim();
    if (!destino) {
      throw new BadRequestException('Falta correo del cliente');
    }

    const siteUrl =
      this.config.get<string>('PUBLIC_SITE_URL') ?? 'http://localhost:5173';
    const link = `${siteUrl}/contrato/${contrato.tokenPublico}`;
    const linkPdf = `${link}/pdf`;
    const nombre = nombreDesdeSnapshot(contrato.snapshotJson);

    const correoAsunto =
      dto.correoAsunto?.trim() || `Contrato ${contrato.numero} - Bosque Mágico`;
    const correoCuerpo =
      dto.correoCuerpo?.trim() ||
      `Hola ${nombre},\n\n` +
        `Te compartimos el contrato ${contrato.numero} de Bosque Mágico.\n\n` +
        `Ver resumen en línea:\n${link}\n\n` +
        `Descargar PDF:\n${linkPdf}\n\n` +
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

    const marcado = await this.marcarEnviado.ejecutar(id);

    return {
      ...marcado,
      enviadoPorSmtp,
      correoDestino: destino,
      correoAsunto,
      correoCuerpo,
    };
  }
}
