import { Injectable } from '@nestjs/common';
import { EtapaEvento, TurnoInteres } from '@prisma/client';
import { mapEventoResponse } from '../../domain/mappers/evento.mapper';
import {
  esFechaCalendario,
  finDiaCalendarioUtc,
  inicioDiaCalendarioUtc,
} from '../../domain/utils/fecha-calendario';
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
      desde: query?.desde
        ? esFechaCalendario(query.desde)
          ? inicioDiaCalendarioUtc(query.desde)
          : new Date(query.desde)
        : undefined,
      hasta: query?.hasta
        ? esFechaCalendario(query.hasta)
          ? finDiaCalendarioUtc(query.hasta)
          : new Date(query.hasta)
        : undefined,
    };
    return this.eventos
      .listar(params)
      .then((lista) => lista.map(mapEventoResponse));
  }
}
