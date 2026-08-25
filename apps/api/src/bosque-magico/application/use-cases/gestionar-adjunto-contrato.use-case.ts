import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TipoAdjuntoContrato } from '@prisma/client';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  directorioAdjuntosContratos,
  eliminarArchivoAdjuntoContrato,
} from '../../domain/utils/contrato-adjunto-files';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { ContratoAdjuntosRepository } from '../../infrastructure/repositories/contrato-adjuntos.repository';
import { ContratosRepository } from '../../infrastructure/repositories/contratos.repository';

const MIME_PERMITIDOS = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const EXT_POR_MIME: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const MAX_BYTES = 5 * 1024 * 1024;

@Injectable()
export class SubirAdjuntoContratoUseCase {
  constructor(
    private readonly contratos: ContratosRepository,
    private readonly adjuntos: ContratoAdjuntosRepository,
    private readonly auditoria: AuditoriaRepository,
  ) {}

  async ejecutar(
    contratoId: string,
    tipo: TipoAdjuntoContrato,
    file: Express.Multer.File,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Archivo requerido');
    }
    if (!MIME_PERMITIDOS.has(file.mimetype)) {
      throw new BadRequestException(
        'Formato no permitido. Use PDF, JPG, PNG o WebP.',
      );
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException('El archivo no debe superar 5 MB');
    }

    const contrato = await this.contratos.obtenerPorId(contratoId);
    if (!contrato) throw new NotFoundException('Contrato no encontrado');

    const previo = await this.adjuntos.obtenerPorContratoYTipo(
      contratoId,
      tipo,
    );
    if (previo?.url) {
      eliminarArchivoAdjuntoContrato(path.basename(previo.url));
    }

    const ext =
      EXT_POR_MIME[file.mimetype] ??
      (path.extname(file.originalname) || '.bin');
    const dir = directorioAdjuntosContratos();
    fs.mkdirSync(dir, { recursive: true });

    const filename = `${contratoId}-${tipo}${ext}`;
    fs.writeFileSync(path.join(dir, filename), file.buffer);

    const url = `/api/uploads/contratos/${filename}`;
    const row = await this.adjuntos.upsert({
      contratoId,
      tipo,
      nombreOriginal: file.originalname || filename,
      url,
      mimeType: file.mimetype,
      tamanoBytes: file.size,
    });

    await this.auditoria.registrar({
      tipoEntidad: 'contrato',
      entidadId: contratoId,
      accion: 'adjunto_subir',
      actorTipo: 'vendedor',
      metadata: { tipo, url },
    });

    return row;
  }
}

@Injectable()
export class EliminarAdjuntoContratoUseCase {
  constructor(
    private readonly contratos: ContratosRepository,
    private readonly adjuntos: ContratoAdjuntosRepository,
    private readonly auditoria: AuditoriaRepository,
  ) {}

  async ejecutar(contratoId: string, tipo: TipoAdjuntoContrato) {
    const contrato = await this.contratos.obtenerPorId(contratoId);
    if (!contrato) throw new NotFoundException('Contrato no encontrado');

    const adjunto = await this.adjuntos.obtenerPorContratoYTipo(
      contratoId,
      tipo,
    );
    if (!adjunto) throw new NotFoundException('Adjunto no encontrado');

    eliminarArchivoAdjuntoContrato(path.basename(adjunto.url));
    await this.adjuntos.eliminar(adjunto.id);

    await this.auditoria.registrar({
      tipoEntidad: 'contrato',
      entidadId: contratoId,
      accion: 'adjunto_eliminar',
      actorTipo: 'vendedor',
      metadata: { tipo },
    });

    return { ok: true };
  }
}
