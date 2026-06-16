import { Injectable, NotFoundException } from '@nestjs/common';
import { mapContratoResponse } from '../../domain/mappers/contrato.mapper';
import { ContratosRepository } from '../../infrastructure/repositories/contratos.repository';

@Injectable()
export class ObtenerContratoPublicoUseCase {
  constructor(private readonly contratos: ContratosRepository) {}

  async ejecutar(token: string) {
    const contrato = await this.contratos.obtenerPorToken(token);
    if (!contrato) throw new NotFoundException('Contrato no encontrado');

    const mapped = mapContratoResponse(contrato);
    const { tokenPublico: _t, ...publica } = mapped as typeof mapped & {
      tokenPublico?: string;
    };

    return {
      ...publica,
      linkPublico: `/contrato/${contrato.tokenPublico}`,
    };
  }
}
