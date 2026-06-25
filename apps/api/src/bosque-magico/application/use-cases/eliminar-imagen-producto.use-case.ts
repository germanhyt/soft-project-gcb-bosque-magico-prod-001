import { Injectable } from '@nestjs/common';
import { GestionarMediaProductoUseCase } from './gestionar-media-producto.use-case';

@Injectable()
export class EliminarImagenProductoUseCase {
  constructor(private readonly gestionar: GestionarMediaProductoUseCase) {}

  ejecutar(productoId: string) {
    return this.gestionar.eliminarTodasImagenes(productoId);
  }
}
