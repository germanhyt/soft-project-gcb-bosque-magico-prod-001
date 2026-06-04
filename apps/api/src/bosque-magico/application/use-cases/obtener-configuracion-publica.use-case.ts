import { Injectable } from '@nestjs/common';
import { ConfiguracionRepository } from '../../infrastructure/repositories/configuracion.repository';

@Injectable()
export class ObtenerConfiguracionPublicaUseCase {
  constructor(private readonly configuracion: ConfiguracionRepository) {}

  ejecutar() {
    return this.configuracion.listarPublicas();
  }
}
