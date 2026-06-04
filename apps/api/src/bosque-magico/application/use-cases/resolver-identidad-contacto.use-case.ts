import { Injectable } from '@nestjs/common';
import { IdentidadContactoService } from '../../domain/services/identidad-contacto.service';

@Injectable()
export class ResolverIdentidadContactoUseCase {
  constructor(private readonly identidad: IdentidadContactoService) {}

  ejecutar(celular: string, correo?: string) {
    return this.identidad.resolver(celular, correo);
  }
}
