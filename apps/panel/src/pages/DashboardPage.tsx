import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { EventoBadge } from '../components/eventos/EventoBadge';
import { Icon } from '../components/ui/Icon';
import { KpiCard } from '../components/ui/KpiCard';
import { MediaRowSkeleton, Skeleton, TableSkeletonRows } from '../components/ui/Skeleton';
import { CANAL_LABEL, ETAPA_LABEL } from '../constants/solicitudes';
import { ETAPA_BADGE } from '../constants/design';
import { fetchResumenSolicitudes, fetchSolicitudes } from '../lib/api';
import type { EtapaSolicitud } from '../lib/api';
import { fetchEventosResumen } from '../lib/eventos';
import { formatMesDia } from '../lib/format';
import { TURNO_LABEL } from '../constants/solicitudes';
import { PageHeader } from '../components/ui/PageHeader';
import { CRUMB_INICIO, crumb } from '../constants/breadcrumbs';

const KPI_CONFIG: {
  etapa: EtapaSolicitud;
  accent: 'primary' | 'secondary' | 'tertiary' | 'primary-container';
  icon: string;
  watermark: string;
}[] = [
  { etapa: 'nueva', accent: 'primary', icon: 'inbox', watermark: 'eco' },
  { etapa: 'en_atencion', accent: 'secondary', icon: 'support_agent', watermark: 'forum' },
  { etapa: 'cotizada', accent: 'tertiary', icon: 'payments', watermark: 'receipt_long' },
  { etapa: 'cerrada', accent: 'primary-container', icon: 'check_circle', watermark: 'event' },
];

export function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['solicitudes-resumen'],
    queryFn: fetchResumenSolicitudes,
  });

  const { data: recientes, isLoading: loadingRecientes } = useQuery({
    queryKey: ['solicitudes-recientes-dashboard'],
    queryFn: () => fetchSolicitudes(undefined, { page: 1, pageSize: 5 }),
  });

  const { data: eventos, isLoading: loadingEventos } = useQuery({
    queryKey: ['eventos-resumen'],
    queryFn: fetchEventosResumen,
  });

  const counts = new Map(data?.map((r) => [r.etapa, r._count._all]) ?? []);
  const proximosConfirmar =
    (eventos?.porEtapa?.por_confirmar ?? 0) + (eventos?.porEtapa?.confirmado ?? 0);

  const solicitudesRecientes = recientes?.items ?? [];

  return (
    <div>
      <PageHeader
        breadcrumbs={[CRUMB_INICIO, crumb('Dashboard')]}
        title="Resumen de Gestión"
        subtitle="Buen día. Aquí está el pulso actual del bosque."
      />

      {isError && (
        <p className="mb-6 rounded-xl border border-error-container bg-error-container/40 px-4 py-3 text-body-sm text-error">
          No se pudo conectar con la API. En la raíz del proyecto ejecuta{' '}
          <code className="rounded bg-surface-container-low px-1">npm run dev:api</code> (debe quedar en el
          puerto 3000 sin error EADDRINUSE), luego reinicia el panel. Si el puerto 3000 está ocupado, cierra
          el proceso anterior antes de volver a iniciar la API.
        </p>
      )}

      <div className="mb-margin-desktop grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">
        {KPI_CONFIG.map(({ etapa, accent, icon, watermark }) => (
          <KpiCard
            key={etapa}
            to={`/solicitudes?etapa=${etapa}`}
            title={ETAPA_LABEL[etapa]}
            value={
              isLoading ? (
                <Skeleton className="mb-1 inline-block h-8 w-12 rounded-full align-middle" />
              ) : (
                (counts.get(etapa) ?? 0)
              )
            }
            hint={etapa === 'nueva' ? 'leads nuevos' : undefined}
            icon={icon}
            watermarkIcon={watermark}
            accent={accent}
          />
        ))}
      </div>

      <div className="mb-margin-desktop grid grid-cols-1 gap-gutter lg:grid-cols-2">
        <section className="flex max-h-[420px] flex-col overflow-hidden rounded-xl bg-surface-container-lowest tactile-card shadow-ambient">
          <div className="flex items-center justify-between border-b border-surface-variant bg-surface p-card-padding">
            <h3 className="text-title-md text-primary">Próximos eventos</h3>
            <Link
              to="/agenda"
              className="flex items-center gap-1 text-body-sm font-medium text-secondary transition-colors hover:text-primary"
            >
              Ver calendario
              <Icon name="arrow_forward" size={16} filled={false} />
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto p-2" aria-busy={loadingEventos}>
            {loadingEventos ? (
              <MediaRowSkeleton />
            ) : eventos?.proximos && eventos.proximos.length > 0 ? (
              eventos.proximos.map((ev) => {
                const { mes, dia } = formatMesDia(ev.fechaEvento);
                return (
                  <Link
                    key={ev.id}
                    to={`/agenda?detalle=${ev.id}`}
                    className="group flex cursor-pointer items-center gap-4 rounded-lg p-4 transition-colors hover:bg-surface-container-low"
                  >
                    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg border border-primary/10 bg-primary-fixed/40 text-primary">
                      <span className="text-label-caps leading-none opacity-80">{mes}</span>
                      <span className="text-title-md leading-none">{dia}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-body-lg font-semibold text-on-surface transition-colors group-hover:text-primary">
                        {ev.cumpleanero.nombre} — {ev.cliente.nombreCompleto}
                      </h4>
                      <p className="mt-0.5 flex items-center gap-1 text-body-sm text-on-surface-variant">
                        <Icon name="park" size={14} filled={false} />
                        {ev.zona} · {TURNO_LABEL[ev.turno] ?? ev.turno}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <EventoBadge etapa={ev.etapa} />
                    </div>
                  </Link>
                );
              })
            ) : (
              <p className="p-6 text-center text-body-sm text-outline">No hay eventos próximos.</p>
            )}
          </div>
        </section>

        <section className="flex max-h-[420px] flex-col overflow-hidden rounded-xl bg-surface-container-lowest tactile-card shadow-ambient">
          <div className="flex items-center justify-between border-b border-surface-variant bg-surface p-card-padding">
            <h3 className="text-title-md text-primary">Solicitudes recientes</h3>
            <Link
              to="/solicitudes"
              className="flex items-center gap-1 text-body-sm font-medium text-secondary transition-colors hover:text-primary"
            >
              Ver todas
              <Icon name="arrow_forward" size={16} filled={false} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-surface-variant bg-surface/50 text-label-caps text-outline">
                  <th className="p-4 font-semibold">Cliente</th>
                  <th className="p-4 font-semibold">Canal</th>
                  <th className="p-4 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="text-body-sm text-on-surface" aria-busy={loadingRecientes}>
                {loadingRecientes ? (
                  <TableSkeletonRows columns={3} rows={4} lastColumn="chip" />
                ) : solicitudesRecientes.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-outline">
                      Sin solicitudes aún.
                    </td>
                  </tr>
                ) : (
                  solicitudesRecientes.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-surface-variant/50 transition-colors hover:bg-surface-container-low"
                    >
                      <td className="p-4">
                        <Link
                          to={`/solicitudes?etapa=${s.etapa}`}
                          className="font-semibold text-on-surface hover:text-primary"
                        >
                          {s.nombreContacto}
                        </Link>
                      </td>
                      <td className="p-4 text-on-surface-variant">
                        {CANAL_LABEL[s.canal] ?? s.canal}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${ETAPA_BADGE[s.etapa]}`}
                        >
                          {ETAPA_LABEL[s.etapa]}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <Link
        to="/agenda?etapa=por_confirmar"
        className="inline-flex items-center gap-2 rounded-xl border border-tertiary-fixed/50 bg-tertiary-fixed/20 p-6 tactile-card"
      >
        <Icon name="event" className="text-tertiary" />
        <div>
          <p className="text-body-sm text-on-surface-variant">Eventos activos (por confirmar + confirmados)</p>
          {loadingEventos ? (
            <Skeleton className="mt-2 h-8 w-12 rounded-full" />
          ) : (
            <p className="text-display-lg text-primary">{proximosConfirmar}</p>
          )}
        </div>
      </Link>
    </div>
  );
}
