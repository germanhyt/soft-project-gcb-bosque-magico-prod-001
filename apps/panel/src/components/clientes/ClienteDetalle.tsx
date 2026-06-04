import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CotizacionBadge } from '../cotizaciones/CotizacionBadge';
import { ClienteRowActions } from './ClienteRowActions';
import { EtapaBadge } from '../ui/EtapaBadge';
import { DetalleModal } from '../ui/DetalleModal';
import { CARD_CLASS } from '../../constants/design';
import { CANAL_LABEL } from '../../constants/solicitudes';
import { fetchCliente, type ClienteListItem } from '../../lib/clientes';
import type { EtapaSolicitud } from '../../lib/api';
import { formatFecha, formatFechaHora } from '../../lib/format';

type Props = {
  clienteId: string | null;
  listItem?: ClienteListItem;
  open: boolean;
  onClose: () => void;
  onEditar?: (id: string) => void;
};

export function ClienteDetalle({ clienteId, listItem, open, onClose, onEditar }: Props) {
  const { data: cliente, isLoading, isError } = useQuery({
    queryKey: ['cliente', clienteId],
    queryFn: () => fetchCliente(clienteId!),
    enabled: open && !!clienteId,
  });

  const c = cliente;
  const titulo = c?.nombreCompleto ?? listItem?.nombreCompleto ?? 'Cliente';

  return (
    <DetalleModal
      open={open && !!clienteId}
      onClose={onClose}
      title={titulo}
      description={listItem?.celular ?? c?.celular}
      loading={isLoading && !c}
    >
      {isError && !c ? (
        <p className="text-error">No se pudo cargar el cliente.</p>
      ) : c ? (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-on-surface-variant">
                {c.celular}
                {c.correo ? ` · ${c.correo}` : ''}
                {c.distrito ? ` · ${c.distrito}` : ''}
              </p>
            </div>
            <ClienteRowActions
              cliente={{
                id: c.id,
                nombreCompleto: c.nombreCompleto,
                celular: c.celular,
                correo: c.correo,
              }}
              mostrarVer={false}
              onEditar={onEditar}
            />
          </div>
          {c.identidad.solicitudesRecientes24h && (
            <p className="mt-3 rounded-lg border border-amber-300/50 bg-amber-50 px-3 py-2 text-body-sm text-amber-900">
              Actividad reciente (24h): misma identidad que en landing.
            </p>
          )}
          <dl className={`mt-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 ${CARD_CLASS}`}>
            <div>
              <dt className="text-label-caps text-outline">Solicitudes</dt>
              <dd className="text-xl font-bold">{c.estadisticas.totalSolicitudes}</dd>
            </div>
            <div>
              <dt className="text-label-caps text-outline">Primera solicitud</dt>
              <dd className="font-medium">
                {c.estadisticas.primeraSolicitudEn
                  ? formatFecha(c.estadisticas.primeraSolicitudEn)
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-label-caps text-outline">Última solicitud</dt>
              <dd className="font-medium">
                {c.estadisticas.ultimaSolicitudEn
                  ? formatFechaHora(c.estadisticas.ultimaSolicitudEn)
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-label-caps text-outline">Cotizaciones / eventos</dt>
              <dd className="font-medium">
                {c.estadisticas.totalCotizaciones} cot. · {c.estadisticas.totalEventos} eventos
              </dd>
            </div>
          </dl>
          <section className="mt-6">
            <h3 className="font-bold text-on-surface">Historial de solicitudes</h3>
            {c.solicitudes.length === 0 ? (
              <p className="mt-2 text-on-surface-variant">Sin solicitudes vinculadas.</p>
            ) : (
              <ul className={`mt-3 divide-y divide-outline/10 ${CARD_CLASS}`}>
                {c.solicitudes.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold">{s.nombreContacto}</p>
                      <p className="text-xs text-on-surface-variant">
                        {CANAL_LABEL[s.canal as keyof typeof CANAL_LABEL] ?? s.canal} ·{' '}
                        {formatFechaHora(s.creadoEn)}
                      </p>
                    </div>
                    <EtapaBadge etapa={s.etapa as EtapaSolicitud} />
                  </li>
                ))}
              </ul>
            )}
          </section>
          {c.cotizaciones.length > 0 && (
            <section className="mt-6">
              <h3 className="font-bold text-on-surface">Cotizaciones</h3>
              <ul className={`mt-3 divide-y divide-outline/10 ${CARD_CLASS}`}>
                {c.cotizaciones.map((cot) => (
                  <li
                    key={cot.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                  >
                    <Link
                      to={`/cotizaciones?detalle=${cot.id}`}
                      className="font-semibold text-primary hover:underline"
                      onClick={onClose}
                    >
                      {cot.codigo}
                    </Link>
                    <div className="flex items-center gap-2">
                      <CotizacionBadge
                        etapa={cot.etapa as 'borrador' | 'enviada' | 'aceptada' | 'cerrada'}
                      />
                      <span className="text-on-surface-variant">{formatFecha(cot.fechaEvento)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {c.notas && (
            <section className={`mt-6 p-4 ${CARD_CLASS}`}>
              <h3 className="text-label-caps text-outline">Notas</h3>
              <p className="mt-2 whitespace-pre-wrap">{c.notas}</p>
            </section>
          )}
        </>
      ) : null}
    </DetalleModal>
  );
}
