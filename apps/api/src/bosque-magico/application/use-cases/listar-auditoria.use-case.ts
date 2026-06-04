import { Injectable } from '@nestjs/common';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';

@Injectable()
export class ListarAuditoriaUseCase {
  constructor(private readonly auditoria: AuditoriaRepository) {}

  ejecutar(tipoEntidad: string, entidadId: string, limite?: number) {
    return this.auditoria.listarPorEntidad(
      tipoEntidad,
      entidadId,
      limite ?? 50,
    );
  }
}
