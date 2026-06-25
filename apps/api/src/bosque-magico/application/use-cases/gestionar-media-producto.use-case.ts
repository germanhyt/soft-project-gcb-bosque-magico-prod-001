import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TipoMediaProducto } from '@prisma/client';
import * as fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import {
  directorioImagenesProductos,
  eliminarArchivoUploadProducto,
  eliminarArchivosImagenProducto,
} from '../../domain/utils/producto-imagen-files';
import { mapProductoResponse } from '../../domain/mappers/producto.mapper';
import { ProductoMediaSyncService } from '../../domain/services/producto-media-sync.service';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { ProductoMediaRepository } from '../../infrastructure/repositories/producto-media.repository';
import { ProductosRepository } from '../../infrastructure/repositories/productos.repository';

const MIME_IMAGEN: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const MIME_VIDEO: Record<string, string> = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
};

function validarUrlVideo(url: string) {
  const trimmed = url.trim();
  if (!trimmed) throw new BadRequestException('URL de video requerida');
  if (trimmed.length > 2048) {
    throw new BadRequestException('URL de video demasiado larga');
  }
  return trimmed;
}

@Injectable()
export class GestionarMediaProductoUseCase {
  constructor(
    private readonly productos: ProductosRepository,
    private readonly media: ProductoMediaRepository,
    private readonly sync: ProductoMediaSyncService,
    private readonly auditoria: AuditoriaRepository,
  ) {}

  private async obtenerProductoConMedios(productoId: string) {
    const producto = await this.productos.obtenerPorId(productoId);
    if (!producto) throw new NotFoundException('Producto no encontrado');
    return producto;
  }

  private async respuesta(productoId: string) {
    const producto = await this.productos.obtenerPorId(productoId);
    if (!producto) throw new NotFoundException('Producto no encontrado');
    return mapProductoResponse(producto);
  }

  async subirImagen(productoId: string, file: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Archivo de imagen requerido');
    }
    const ext = MIME_IMAGEN[file.mimetype];
    if (!ext) {
      throw new BadRequestException(
        'Formato no permitido. Use JPG, PNG o WebP.',
      );
    }
    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException('La imagen no debe superar 2 MB');
    }

    await this.obtenerProductoConMedios(productoId);

    const dir = directorioImagenesProductos();
    fs.mkdirSync(dir, { recursive: true });

    const filename = `${productoId}-${randomUUID()}${ext}`;
    fs.writeFileSync(`${dir}/${filename}`, file.buffer);
    const url = `/api/uploads/productos/${filename}`;
    const orden = await this.media.siguienteOrdenImagen(productoId);

    await this.media.crear({
      productoId,
      tipo: TipoMediaProducto.imagen,
      url,
      nombreOriginal: file.originalname,
      mimeType: file.mimetype,
      tamanoBytes: file.size,
      orden,
    });
    await this.sync.syncImagenUrlPrincipal(productoId);

    await this.auditoria.registrar({
      tipoEntidad: 'producto',
      entidadId: productoId,
      accion: 'subir_imagen_galeria',
      actorTipo: 'admin',
      metadata: { url },
    });

    return this.respuesta(productoId);
  }

  async eliminarMedia(productoId: string, mediaId: string) {
    await this.obtenerProductoConMedios(productoId);
    const media = await this.media.obtenerPorId(mediaId);
    if (!media || media.productoId !== productoId) {
      throw new NotFoundException('Media no encontrada');
    }

    if (media.tipo === TipoMediaProducto.imagen) {
      eliminarArchivoUploadProducto(media.url);
    } else {
      eliminarArchivoUploadProducto(media.url);
    }

    await this.media.eliminar(mediaId);
    if (media.tipo === TipoMediaProducto.imagen) {
      await this.sync.syncImagenUrlPrincipal(productoId);
    }

    await this.auditoria.registrar({
      tipoEntidad: 'producto',
      entidadId: productoId,
      accion: 'eliminar_media',
      actorTipo: 'admin',
      metadata: { mediaId, tipo: media.tipo },
    });

    return this.respuesta(productoId);
  }

  async eliminarTodasImagenes(productoId: string) {
    const producto = await this.obtenerProductoConMedios(productoId);
    const medios = (producto.medios ?? []).filter(
      (m) => m.tipo === TipoMediaProducto.imagen,
    );

    for (const m of medios) {
      eliminarArchivoUploadProducto(m.url);
      await this.media.eliminar(m.id);
    }

    eliminarArchivosImagenProducto(productoId);
    await this.productos.actualizar(productoId, { imagenUrl: null });

    await this.auditoria.registrar({
      tipoEntidad: 'producto',
      entidadId: productoId,
      accion: 'quitar_imagen',
      actorTipo: 'admin',
      metadata: { cantidad: medios.length },
    });

    return this.respuesta(productoId);
  }

  async guardarVideoUrl(productoId: string, urlRaw: string) {
    await this.obtenerProductoConMedios(productoId);
    const url = validarUrlVideo(urlRaw);

    const existente = (await this.media.listarPorProducto(productoId)).find(
      (m) => m.tipo === TipoMediaProducto.video,
    );
    if (existente?.url.startsWith('/api/uploads/')) {
      eliminarArchivoUploadProducto(existente.url);
    }

    await this.media.eliminarVideo(productoId);
    await this.media.crear({
      productoId,
      tipo: TipoMediaProducto.video,
      url,
      orden: 0,
    });

    await this.auditoria.registrar({
      tipoEntidad: 'producto',
      entidadId: productoId,
      accion: 'guardar_video_url',
      actorTipo: 'admin',
      metadata: { url },
    });

    return this.respuesta(productoId);
  }

  async subirVideo(productoId: string, file: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Archivo de video requerido');
    }
    const ext = MIME_VIDEO[file.mimetype];
    if (!ext) {
      throw new BadRequestException('Formato no permitido. Use MP4 o WebM.');
    }
    if (file.size > 50 * 1024 * 1024) {
      throw new BadRequestException('El video no debe superar 50 MB');
    }

    await this.obtenerProductoConMedios(productoId);

    const dir = directorioImagenesProductos();
    fs.mkdirSync(dir, { recursive: true });

    const existente = (await this.media.listarPorProducto(productoId)).find(
      (m) => m.tipo === TipoMediaProducto.video,
    );
    if (existente?.url.startsWith('/api/uploads/')) {
      eliminarArchivoUploadProducto(existente.url);
    }
    await this.media.eliminarVideo(productoId);

    const filename = `${productoId}-video-${randomUUID()}${ext}`;
    fs.writeFileSync(`${dir}/${filename}`, file.buffer);
    const url = `/api/uploads/productos/${filename}`;

    await this.media.crear({
      productoId,
      tipo: TipoMediaProducto.video,
      url,
      nombreOriginal: file.originalname,
      mimeType: file.mimetype,
      tamanoBytes: file.size,
      orden: 0,
    });

    await this.auditoria.registrar({
      tipoEntidad: 'producto',
      entidadId: productoId,
      accion: 'subir_video',
      actorTipo: 'admin',
      metadata: { url },
    });

    return this.respuesta(productoId);
  }

  async eliminarVideo(productoId: string) {
    const producto = await this.obtenerProductoConMedios(productoId);
    const video = (producto.medios ?? []).find(
      (m) => m.tipo === TipoMediaProducto.video,
    );
    if (!video) {
      throw new NotFoundException('El producto no tiene video');
    }

    if (video.url.startsWith('/api/uploads/')) {
      eliminarArchivoUploadProducto(video.url);
    }
    await this.media.eliminarVideo(productoId);

    await this.auditoria.registrar({
      tipoEntidad: 'producto',
      entidadId: productoId,
      accion: 'eliminar_video',
      actorTipo: 'admin',
    });

    return this.respuesta(productoId);
  }
}
