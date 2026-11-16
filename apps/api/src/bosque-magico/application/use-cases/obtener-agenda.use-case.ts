import { Injectable } from '@nestjs/common';
import { mapEventoResponse } from '../../domain/mappers/evento.mapper';
import {
  claveFechaCalendario,
  esFechaCalendario,
  fechaCalendarioHoy,
  finDiaCalendarioUtc,
  inicioDiaCalendarioUtc,
} from '../../domain/utils/fecha-calendario';
import {
  cotizacionVisibleEnCalendario,
  fusionarAgendaPorFecha,
} from '../../domain/utils/ocupacion-calendario';
import { CotizacionesRepository } from '../../infrastructure/repositories/cotizaciones.repository';
import { EventosRepository } from '../../infrastructure/repositories/eventos.repository';

@Injectable()
export class ObtenerAgendaUseCase {
  constructor(
    private readonly eventos: EventosRepository,
    private readonly cotizaciones: CotizacionesRepository,
  ) {}

  async ejecutar(desde?: string, hasta?: string) {
    const inicio = desde
      ? esFechaCalendario(desde)
        ? inicioDiaCalendarioUtc(desde)
        : new Date(desde)
      : inicioDiaCalendarioUtc(fechaCalendarioHoy());

    const fin = hasta
      ? esFechaCalendario(hasta)
        ? finDiaCalendarioUtc(hasta)
        : new Date(hasta)
      : finDiaCalendarioUtc(
          claveFechaCalendario(
            new Date(inicio.getTime() + 60 * 24 * 60 * 60 * 1000),
          ),
        );

    const [eventos, resumen, proximos, cotizaciones] = await Promise.all([
      this.eventos.listar({ desde: inicio, hasta: fin }),
      this.eventos.contarPorEtapa(),
      this.eventos.proximos(8),
      this.cotizaciones.listarParaCalendario(inicio, fin),
    ]);

    const agenda = fusionarAgendaPorFecha(
      eventos.map((ev) => ({
        fecha: claveFechaCalendario(ev.fechaEvento),
        item: mapEventoResponse(ev),
      })),
      cotizaciones
        .filter((cot) => cotizacionVisibleEnCalendario(cot.etapa))
        .map((cot) => ({
          fecha: claveFechaCalendario(cot.fechaEvento),
          item: {
            id: cot.id,
            codigo: cot.codigo,
            etapa: cot.etapa,
            fechaEvento: claveFechaCalendario(cot.fechaEvento),
            turno: cot.turno,
            horarioInicio: cot.horarioInicio,
            horarioFin: cot.horarioFin,
            cliente: { nombreCompleto: cot.cliente.nombreCompleto },
          },
        })),
    );

    return {
      agenda,
      resumen: Object.fromEntries(resumen.map((r) => [r.etapa, r._count._all])),
      proximos: proximos.map(mapEventoResponse),
      total: eventos.length,
    };
  }
}
