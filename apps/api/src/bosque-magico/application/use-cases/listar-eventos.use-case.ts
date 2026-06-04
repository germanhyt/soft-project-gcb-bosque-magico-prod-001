import { Injectable } from '@nestjs/common';
import { EtapaEvento, TurnoInteres } from '@prisma/client';
import { mapEventoResponse } from '../../domain/mappers/evento.mapper';
import { EventosRepository } from '../../infrastructure/repositories/eventos.repository';

@Injectable()
export class ListarEventosUseCase {
  constructor(private readonly eventos: EventosRepository) {}

  ejecutar(query?: {
    etapa?: EtapaEvento;
    desde?: string;
    hasta?: string;
    turno?: TurnoInteres;
  }) {
    const params = {
      etapa: query?.etapa,
      turno: query?.turno,
      desde: query?.desde ? new Date(query.desde) : undefined,
      hasta: query?.hasta ? new Date(query.hasta) : undefined,
    };
    return this.eventos
      .listar(params)
      .then((lista) => lista.map(mapEventoResponse));
  }
}
