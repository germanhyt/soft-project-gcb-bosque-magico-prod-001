import { Injectable } from '@nestjs/common';
import { GestionarMediaProductoUseCase } from './gestionar-media-producto.use-case';

@Injectable()
export class SubirImagenProductoUseCase {
  constructor(private readonly gestionar: GestionarMediaProductoUseCase) {}

  ejecutar(productoId: string, file: Express.Multer.File) {
    return this.gestionar.subirImagen(productoId, file);
  }
}
