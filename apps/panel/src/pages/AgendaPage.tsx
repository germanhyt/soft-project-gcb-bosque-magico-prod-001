import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AgendaMonthCalendar } from '../components/agenda/AgendaMonthCalendar';
import { EventoDetallePanel } from '../components/eventos/EventoDetallePanel';
import { EventoBadge } from '../components/eventos/EventoBadge';
import { AlertError } from '../components/ui/Alert';
import { FilterSelect } from '../components/ui/FilterSelect';
import { Icon } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import { TableFiltersPanel } from '../components/ui/TableFiltersPanel';
import { CARD_CLASS, ETAPA_EVENTO_CARD, INPUT_CLASS } from '../constants/design';
import { CRUMB_INICIO, crumb } from '../constants/breadcrumbs';
import { ETAPAS_EVENTO_FILTRO } from '../constants/eventos';
import { TURNO_LABEL } from '../constants/solicitudes';
import { mesToParam, parseMesParam, rangoMes } from '../lib/agenda-calendar';
import { fetchAgenda, type EtapaEvento, type Evento } from '../lib/eventos';
import { formatFecha } from '../lib/format';

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

type VistaAgenda = 'lista' | 'mes';

export function AgendaPage() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const vista = (searchParams.get('vista') === 'mes' ? 'mes' : 'lista') as VistaAgenda;
  const etapaFiltro = (searchParams.get('etapa') ?? '') as '' | EtapaEvento;
  const [selected, setSelected] = useState<Evento | null>(null);

  const { year, month } = parseMesParam(searchParams.get('mes'));
  const mesParam = mesToParam(year, month);
  const { desde: desdeMes, hasta: hastaMes } = rangoMes(year, month);

  const desde = vista === 'mes' ? desdeMes : (searchParams.get('desde') ?? isoDate(new Date()));
  const hasta =
    vista === 'mes'
      ? hastaMes
      : (searchParams.get('hasta') ??
        isoDate(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)));

  const diaMes = searchParams.get('dia') ?? '';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['agenda', desde, hasta],
    queryFn: () => fetchAgenda(desde, hasta),
  });

  const eventosPorFecha = useMemo(() => {
    const map = new Map<string, Evento[]>();
    for (const dia of data?.agenda ?? []) {
      const filtrados = etapaFiltro
        ? dia.eventos.filter((e) => e.etapa === etapaFiltro)
        : dia.eventos;
      if (filtrados.length) map.set(dia.fecha, filtrados);
    }
    return map;
  }, [data, etapaFiltro]);

  const agendaFiltrada = useMemo(() => {
    if (!data?.agenda) return [];
    let rows = data.agenda;
    if (etapaFiltro) {
      rows = rows
        .map((dia) => ({
          ...dia,
          eventos: dia.eventos.filter((e) => e.etapa === etapaFiltro),
        }))
        .filter((dia) => dia.eventos.length > 0);
    }
    if (vista === 'mes' && diaMes) {
      return rows.filter((d) => d.fecha === diaMes);
    }
    return rows;
  }, [data, etapaFiltro, vista, diaMes]);

  const totalEventos = useMemo(() => {
    if (vista === 'mes' && !diaMes) {
      let n = 0;
      eventosPorFecha.forEach((evs) => {
        n += evs.length;
      });
      return n;
    }
    return agendaFiltrada.reduce((n, d) => n + d.eventos.length, 0);
  }, [vista, diaMes, eventosPorFecha, agendaFiltrada]);

  const patchParams = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    setSearchParams(next);
  };

  const setVista = (v: VistaAgenda) => {
    if (v === 'mes') {
      patchParams({ vista: 'mes', mes: mesParam, desde: undefined, hasta: undefined });
    } else {
      patchParams({
        vista: undefined,
        mes: undefined,
        dia: undefined,
        desde: searchParams.get('desde') ?? isoDate(new Date()),
        hasta:
          searchParams.get('hasta') ??
          isoDate(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)),
      });
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col">
      <PageHeader
        breadcrumbs={[CRUMB_INICIO, crumb('Agenda')]}
        count={!isLoading && !isError ? `${totalEventos} evento${totalEventos === 1 ? '' : 's'}` : undefined}
      >
        <div className="flex rounded-full border border-surface-variant bg-surface-container-low p-0.5">
          <button
            type="button"
            onClick={() => setVista('lista')}
            className={`rounded-full px-4 py-1.5 text-body-sm font-semibold transition ${
              vista === 'lista'
                ? 'bg-surface-container-lowest text-primary shadow-ambient'
                : 'text-outline hover:text-primary'
            }`}
          >
            Lista
          </button>
          <button
            type="button"
            onClick={() => setVista('mes')}
            className={`rounded-full px-4 py-1.5 text-body-sm font-semibold transition ${
              vista === 'mes'
                ? 'bg-surface-container-lowest text-primary shadow-ambient'
                : 'text-outline hover:text-primary'
            }`}
          >
            Mes
          </button>
        </div>
      </PageHeader>

      {data?.resumen && (
        <div className="mb-4 flex flex-wrap gap-3">
          {(Object.entries(data.resumen) as [EtapaEvento, number][]).map(([etapa, count]) => (
            <div
              key={etapa}
              className="flex items-center gap-2 rounded-xl border border-surface-variant bg-surface-container-lowest px-4 py-2 text-body-sm shadow-ambient"
            >
              <EventoBadge etapa={etapa} />
              <span className="font-bold text-primary">{count}</span>
            </div>
          ))}
        </div>
      )}

      {vista === 'lista' && (
        <TableFiltersPanel
          className="mb-4"
          onRefresh={() => void qc.invalidateQueries({ queryKey: ['agenda'] })}
        >
          <label className="flex min-w-[160px] flex-col gap-1 text-body-sm">
            <input
              type="date"
              className={`${INPUT_CLASS} h-[42px]`}
              value={desde}
              onChange={(e) => patchParams({ desde: e.target.value })}
              aria-label="Desde"
            />
          </label>
          <label className="flex min-w-[160px] flex-col gap-1 text-body-sm">
            <input
              type="date"
              className={`${INPUT_CLASS} h-[42px]`}
              value={hasta}
              onChange={(e) => patchParams({ hasta: e.target.value })}
              aria-label="Hasta"
            />
          </label>
          <FilterSelect
            inline
            label="Estado"
            value={etapaFiltro}
            options={ETAPAS_EVENTO_FILTRO}
            onChange={(value) => patchParams({ etapa: value || undefined })}
          />
        </TableFiltersPanel>
      )}

      {vista === 'mes' && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <FilterSelect
            inline
            label="Estado"
            value={etapaFiltro}
            options={ETAPAS_EVENTO_FILTRO}
            onChange={(value) => patchParams({ etapa: value || undefined })}
          />
          <button
            type="button"
            onClick={() => void qc.invalidateQueries({ queryKey: ['agenda'] })}
            className="flex h-[42px] w-[42px] items-center justify-center rounded-lg border border-surface-variant text-primary transition hover:bg-surface-container-low"
            aria-label="Actualizar"
          >
            <Icon name="refresh" size={22} filled={false} />
          </button>
          {diaMes && (
            <button
              type="button"
              onClick={() => patchParams({ dia: undefined })}
              className="text-body-sm font-medium text-secondary hover:text-primary"
            >
              Ver todo el mes
            </button>
          )}
        </div>
      )}

      {isError && <AlertError>No se pudo cargar la agenda. ¿Está la API en ejecución?</AlertError>}

      <div className={`overflow-hidden ${CARD_CLASS}`}>
        <div className="overflow-y-auto p-4">
          {isLoading && <p className="text-outline">Cargando agenda…</p>}

          {vista === 'mes' && !isLoading && (
            <>
              <AgendaMonthCalendar
                mes={mesParam}
                eventosPorFecha={eventosPorFecha}
                diaSeleccionado={diaMes || undefined}
                onMesChange={(m) => patchParams({ mes: m, dia: undefined })}
                onDiaClick={(fecha) => {
                  patchParams({ dia: fecha });
                  setSelected(null);
                }}
              />
              {diaMes && (
                <section className="mt-6 border-t border-surface-variant pt-6">
                  <h3 className="text-title-md text-primary">{formatFecha(diaMes)}</h3>
                  {agendaFiltrada.length === 0 ? (
                    <p className="mt-2 text-on-surface-variant">Sin eventos este día.</p>
                  ) : (
                    <ul className="mt-3 space-y-3">
                      {agendaFiltrada[0]?.eventos.map((ev) => (
                        <li key={ev.id}>
                          <button
                            type="button"
                            onClick={() => setSelected(ev)}
                            className={`w-full rounded-xl border border-surface-variant bg-surface-container-lowest p-4 text-left tactile-card ${ETAPA_EVENTO_CARD[ev.etapa]} ${
                              selected?.id === ev.id ? 'ring-2 ring-primary' : ''
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-semibold text-on-surface">
                                {ev.cliente.nombreCompleto}
                              </span>
                              <EventoBadge etapa={ev.etapa} />
                            </div>
                            <p className="mt-1 text-body-sm text-on-surface-variant">
                              {TURNO_LABEL[ev.turno] ?? ev.turno} · {ev.cantidadNinos} niños
                            </p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}
            </>
          )}

          {vista === 'lista' && !isLoading && agendaFiltrada.length === 0 && (
            <p className="text-on-surface-variant">
              No hay eventos en el rango seleccionado. Acepta una cotización para crear uno.
            </p>
          )}

          {vista === 'lista' && (
            <div className="space-y-8">
              {agendaFiltrada.map((dia) => (
                <section key={dia.fecha}>
                  <h2 className="sticky top-0 bg-surface-container-lowest/95 py-2 text-title-md text-primary">
                    {formatFecha(dia.fecha)}
                  </h2>
                  <ul className="mt-2 space-y-3">
                    {dia.eventos.map((ev) => (
                      <li key={ev.id}>
                        <button
                          type="button"
                          onClick={() => setSelected(ev)}
                          className={`w-full rounded-xl border border-surface-variant bg-surface-container-lowest p-4 text-left tactile-card ${ETAPA_EVENTO_CARD[ev.etapa]} ${
                            selected?.id === ev.id ? 'ring-2 ring-primary' : ''
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold text-on-surface">
                              {ev.cliente.nombreCompleto}
                            </span>
                            <EventoBadge etapa={ev.etapa} />
                          </div>
                          <p className="mt-1 text-body-sm text-on-surface-variant">
                            {TURNO_LABEL[ev.turno] ?? ev.turno} · {ev.cantidadNinos} niños · S/{' '}
                            {ev.montoTotal.toFixed(2)}
                          </p>
                          <p className="text-body-sm text-outline">
                            {ev.cumpleanero.nombre}
                            {ev.cotizacion ? ` · ${ev.cotizacion.codigo}` : ''}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>

      <EventoDetallePanel
        evento={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
