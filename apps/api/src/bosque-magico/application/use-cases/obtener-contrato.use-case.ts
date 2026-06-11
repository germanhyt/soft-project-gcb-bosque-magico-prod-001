import { Injectable, NotFoundException } from '@nestjs/common';
import { mapContratoResponse } from '../../domain/mappers/contrato.mapper';
import { ContratosRepository } from '../../infrastructure/repositories/contratos.repository';

@Injectable()
export class ObtenerContratoUseCase {
  constructor(private readonly contratos: ContratosRepository) {}

  async ejecutar(id: string) {
    const contrato = await this.contratos.obtenerPorId(id);
    if (!contrato) throw new NotFoundException('Contrato no encontrado');
    return mapContratoResponse(contrato);
  }
}

@Injectable()
export class ObtenerContratoPorEventoUseCase {
  constructor(private readonly contratos: ContratosRepository) {}

  async ejecutar(eventoId: string) {
    const contrato = await this.contratos.obtenerPorEventoId(eventoId);
    if (!contrato) return null;
    return mapContratoResponse(contrato);
  }
}
