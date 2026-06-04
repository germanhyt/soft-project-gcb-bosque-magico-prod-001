import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { AuditoriaTimeline } from '../auditoria/AuditoriaTimeline';
import { CotizacionBadge } from './CotizacionBadge';
import { DetalleModal } from '../ui/DetalleModal';
import { Button } from '../ui/Button';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';
import { CARD_CLASS } from '../../constants/design';
import { ETAPA_COT_LABEL } from '../../constants/cotizaciones';
import { TURNO_LABEL } from '../../constants/solicitudes';
import {
  aceptarCotizacionPanel,
  enviarCotizacion,
  fetchCotizacion,
  linkPublicoCompleto,
  type Cotizacion,
} from '../../lib/cotizaciones';
import { formatFecha } from '../../lib/format';

function invalidateCotizacionQueries(qc: ReturnType<typeof useQueryClient>, id: string) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: ['cotizacion', id] }),
    qc.invalidateQueries({ queryKey: ['cotizaciones'] }),
    qc.invalidateQueries({ queryKey: ['solicitudes'] }),
    qc.invalidateQueries({ queryKey: ['solicitudes-resumen'] }),
    qc.invalidateQueries({ queryKey: ['eventos-resumen'] }),
    qc.invalidateQueries({ queryKey: ['agenda'] }),
  ]);
}

type Props = {
  cotizacionId: string | null;
  listItem?: Cotizacion;
  open: boolean;
  onClose: () => void;
  onAbrirSolicitud?: () => void;
  onEditarBorrador?: (id: string) => void;
};

export function CotizacionDetalle({
  cotizacionId,
  listItem,
  open,
  onClose,
  onAbrirSolicitud,
  onEditarBorrador,
}: Props) {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: cot, isLoading, isError } = useQuery({
    queryKey: ['cotizacion', cotizacionId],
    queryFn: () => fetchCotizacion(cotizacionId!),
    enabled: open && !!cotizacionId,
    initialData: listItem,
  });

  const enviarMut = useMutation({
    mutationFn: (canal: 'whatsapp' | 'email') =>
      enviarCotizacion(cotizacionId!, {
        canal,
        celularDestino: cot?.cliente.celular,
        correoDestino: cot?.cliente.correo ?? undefined,
      }),
    onSuccess: async (res, canal) => {
      await invalidateCotizacionQueries(qc, cotizacionId!);
      if (canal === 'whatsapp' && res.mensajePrearmado && cot?.cliente.celular) {
        const url = `https://wa.me/51${cot.cliente.celular.replace(/\D/g, '')}?text=${encodeURIComponent(res.mensajePrearmado)}`;
        window.open(url, '_blank');
      }
      await Swal.fire({
        icon: 'success',
        title: 'Cotización enviada',
        html: `<p class="text-sm">Link: <a href="${res.linkPublico}" target="_blank">${res.linkPublico}</a></p>`,
      });
    },
    onError: async (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? '')
          : 'No se pudo enviar';
      await Swal.fire({ icon: 'error', title: 'Error', text: msg });
    },
  });

  const aceptarMut = useMutation({
    mutationFn: () => aceptarCotizacionPanel(cotizacionId!),
    onSuccess: async (res: { eventoId?: string }) => {
      await invalidateCotizacionQueries(qc, cotizacionId!);
      await Swal.fire({
        icon: 'success',
        title: 'Cotización aceptada',
        text: res.eventoId ? 'Se creó el evento en agenda (por confirmar).' : undefined,
      });
      if (res.eventoId) onClose();
    },
    onError: async (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? '')
          : '';
      await Swal.fire({ icon: 'error', title: 'No se pudo aceptar', text: msg || undefined });
    },
  });

  const copiarLink = async () => {
    if (!cot) return;
    const link = linkPublicoCompleto(cot.tokenPublico);
    await navigator.clipboard.writeText(link);
    await Swal.fire({ icon: 'success', title: 'Link copiado', timer: 1200, showConfirmButton: false });
  };

  if (!open || !cotizacionId) return null;

  const titulo = cot?.codigo ?? listItem?.codigo ?? 'Cotización';
  const evento = cot?.eventos?.[0];
  const puedeEnviar = cot?.etapa === 'borrador' || cot?.etapa === 'enviada';
  const solicitud = cot?.solicitud;
  const link = cot ? linkPublicoCompleto(cot.tokenPublico) : '';

  const footer =
    cot && !isLoading ? (
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {cot.etapa === 'borrador' && (
          <Button
            variant="accent"
            className="sm:flex-1"
            onClick={() => {
              onClose();
              if (onEditarBorrador) onEditarBorrador(cot.id);
              else navigate(`/cotizaciones?editar=${cot.id}`);
            }}
          >
            Editar borrador
          </Button>
        )}
        <Button variant="ghost" className="sm:flex-1" onClick={() => void copiarLink()}>
          Copiar link público
        </Button>
        {puedeEnviar && (
          <>
            <Button
              className="inline-flex gap-2 sm:flex-1"
              disabled={enviarMut.isPending}
              onClick={() => enviarMut.mutate('whatsapp')}
            >
              <WhatsAppIcon size={20} className="text-on-primary" />
              Enviar por WhatsApp
            </Button>
            {cot.cliente.correo && (
              <Button
                variant="secondary"
                className="sm:flex-1"
                disabled={enviarMut.isPending}
                onClick={() => enviarMut.mutate('email')}
              >
                Enviar por correo
              </Button>
            )}
          </>
        )}
        {cot.etapa === 'enviada' && (
          <Button
            variant="accent"
            className="sm:flex-1"
            disabled={aceptarMut.isPending}
            onClick={() => aceptarMut.mutate()}
          >
            Aceptar (equipo)
          </Button>
        )}
      </div>
    ) : undefined;

  return (
    <DetalleModal
      open={open}
      onClose={onClose}
      title={titulo}
      description={
        cot
          ? `${cot.cliente.nombreCompleto} · ${ETAPA_COT_LABEL[cot.etapa]}`
          : undefined
      }
      loading={isLoading && !cot}
      footer={footer}
    >
      {isError && !cot ? (
        <p className="text-error">Cotización no encontrada o error de API.</p>
      ) : cot ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <CotizacionBadge etapa={cot.etapa} />
            <span className="text-on-surface-variant">
              {cot.cumpleanero.nombre}
              {cot.cumpleanero.edad ? ` (${cot.cumpleanero.edad} años)` : ''}
            </span>
          </div>

          {(solicitud || evento) && (
            <div className={`flex flex-wrap gap-3 p-4 ${CARD_CLASS}`}>
              {solicitud && onAbrirSolicitud && (
                <button
                  type="button"
                  className="text-body-sm font-semibold text-primary hover:underline"
                  onClick={onAbrirSolicitud}
                >
                  Solicitud: {solicitud.nombreContacto}
                </button>
              )}
              {evento && (
                <span className="text-body-sm text-on-surface-variant">
                  Evento en agenda ({evento.etapa})
                </span>
              )}
            </div>
          )}

          {cot.etapa === 'borrador' && (
            <p className="rounded-lg border border-primary/30 bg-primary-fixed/20 px-4 py-3 text-primary">
              Borrador listo: revisa montos y envía el link al cliente.
            </p>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <dl className={`grid gap-3 p-4 sm:grid-cols-2 ${CARD_CLASS}`}>
              <div>
                <dt className="text-label-caps text-outline">Fecha evento</dt>
                <dd className="font-medium">{formatFecha(cot.fechaEvento)}</dd>
              </div>
              <div>
                <dt className="text-label-caps text-outline">Turno</dt>
                <dd className="font-medium">{TURNO_LABEL[cot.turno] ?? cot.turno}</dd>
              </div>
              <div>
                <dt className="text-label-caps text-outline">Niños</dt>
                <dd className="font-medium">{cot.cantidadNinos}</dd>
              </div>
              <div>
                <dt className="text-label-caps text-outline">Paquete</dt>
                <dd className="font-medium">{cot.paquete ?? '—'}</dd>
              </div>
            </dl>
            <dl className={`space-y-2 p-4 ${CARD_CLASS}`}>
              <div className="flex justify-between">
                <dt>Tarifa base</dt>
                <dd>S/ {cot.montoBase.toFixed(2)}</dd>
              </div>
              {cot.montoNinosExtra > 0 && (
                <div className="flex justify-between">
                  <dt>Niños extra</dt>
                  <dd>S/ {cot.montoNinosExtra.toFixed(2)}</dd>
                </div>
              )}
              {cot.montoItems > 0 && (
                <div className="flex justify-between">
                  <dt>Servicios</dt>
                  <dd>S/ {cot.montoItems.toFixed(2)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-surface-variant pt-2 text-lg font-bold text-primary">
                <dt>Total</dt>
                <dd>S/ {cot.montoTotal.toFixed(2)}</dd>
              </div>
            </dl>
          </div>

          {cot.items && cot.items.length > 0 && (
            <div className={`p-4 ${CARD_CLASS}`}>
              <h3 className="font-bold text-primary">Servicios</h3>
              <ul className="mt-3 space-y-2">
                {cot.items.map((i) => (
                  <li key={i.id} className="flex justify-between">
                    <span>
                      {i.nombre} × {i.cantidad}
                    </span>
                    <span>S/ {i.subtotal.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="break-all text-xs text-outline">{link}</p>

          <div>
            <h3 className="font-bold text-primary">Bitácora</h3>
            <div className="mt-3">
              <AuditoriaTimeline tipoEntidad="cotizacion" entidadId={cot.id} />
            </div>
          </div>
        </div>
      ) : null}
    </DetalleModal>
  );
}
