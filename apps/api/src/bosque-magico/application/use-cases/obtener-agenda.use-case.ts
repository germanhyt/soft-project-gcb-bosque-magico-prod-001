import { Injectable } from '@nestjs/common';
import { mapEventoResponse } from '../../domain/mappers/evento.mapper';
import { EventosRepository } from '../../infrastructure/repositories/eventos.repository';

@Injectable()
export class ObtenerAgendaUseCase {
  constructor(private readonly eventos: EventosRepository) {}

  async ejecutar(desde?: string, hasta?: string) {
    const inicio = desde ? new Date(desde) : new Date();
    if (!desde) inicio.setHours(0, 0, 0, 0);
    const fin = hasta
      ? new Date(hasta)
      : new Date(inicio.getTime() + 60 * 24 * 60 * 60 * 1000);
    if (!hasta) fin.setHours(23, 59, 59, 999);

    const [eventos, resumen, proximos] = await Promise.all([
      this.eventos.listar({ desde: inicio, hasta: fin }),
      this.eventos.contarPorEtapa(),
      this.eventos.proximos(8),
    ]);

    const porFecha = new Map<string, ReturnType<typeof mapEventoResponse>[]>();
    for (const ev of eventos) {
      const mapped = mapEventoResponse(ev);
      const key = new Date(ev.fechaEvento).toISOString().slice(0, 10);
      if (!porFecha.has(key)) porFecha.set(key, []);
      porFecha.get(key)!.push(mapped);
    }

    const agenda = [...porFecha.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, items]) => ({ fecha, eventos: items }));

    return {
      agenda,
      resumen: Object.fromEntries(resumen.map((r) => [r.etapa, r._count._all])),
      proximos: proximos.map(mapEventoResponse),
      total: eventos.length,
    };
  }
}
