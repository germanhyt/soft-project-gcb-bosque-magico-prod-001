import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { AuditoriaTimeline } from '../auditoria/AuditoriaTimeline';
import { AceptarCotizacionAction } from './AceptarCotizacionAction';
import { CotizacionBadge } from './CotizacionBadge';
import { EnviarCotizacionActions } from './EnviarCotizacionActions';
import { DetalleModal } from '../ui/DetalleModal';
import { Button } from '../ui/Button';
import { CARD_CLASS } from '../../constants/design';
import { ETAPA_COT_LABEL } from '../../constants/cotizaciones';
import { TURNO_LABEL } from '../../constants/solicitudes';
import { fetchProductosCatalogo } from '../../lib/configuracion';
import {
  fetchCotizacion,
  linkPdfPublicoCompleto,
  linkPublicoCompleto,
  type Cotizacion,
  type Producto,
} from '../../lib/cotizaciones';
import { fetchContratoEvento } from '../../lib/contratos';
import { ETAPA_CONTRATO_LABEL } from '../../constants/contratos';
import { descripcionCantidadProducto, etiquetaOrigenItem } from '../../lib/origen-item';
import { GenerarContratoAction } from '../contratos/GenerarContratoAction';
import { DetalleActionGroup, DetalleActionsFooter } from '../ui/DetalleActionGroup';
import { imprimirCotizacionPdf } from '../../lib/cotizacion-print';
import {
  puedeAceptarCotizacion,
  puedeEditarCotizacionBorrador,
  puedeEnviarCotizacion,
  puedeGenerarContrato,
} from '../../lib/flujo-estados';
import { formatFecha } from '../../lib/format';

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
  const navigate = useNavigate();

  const { data: cot, isLoading, isError } = useQuery({
    queryKey: ['cotizacion', cotizacionId],
    queryFn: () => fetchCotizacion(cotizacionId!),
    enabled: open && !!cotizacionId,
    initialData: listItem,
  });

  const { data: productos = [] } = useQuery({
    queryKey: ['productos-catalogo'],
    queryFn: () => fetchProductosCatalogo(),
    enabled: open,
    staleTime: 1000 * 60 * 10,
  });

  const productosById = useMemo(() => new Map(productos.map((p) => [p.id, p])), [productos]);

  const eventoId = cot?.eventos?.[0]?.id;

  const { data: contratoEvento } = useQuery({
    queryKey: ['contrato-evento', eventoId],
    queryFn: () => fetchContratoEvento(eventoId!),
    enabled: open && !!eventoId,
  });

  const copiarLink = async () => {
    if (!cot) return;
    const link = linkPublicoCompleto(cot.tokenPublico);
    await navigator.clipboard.writeText(link);
    await Swal.fire({ icon: 'success', title: 'Link copiado', timer: 1200, showConfirmButton: false });
  };

  const copiarLinkPdf = async () => {
    if (!cot) return;
    const link = linkPdfPublicoCompleto(cot.tokenPublico);
    await navigator.clipboard.writeText(link);
    await Swal.fire({ icon: 'success', title: 'Link PDF copiado', timer: 1200, showConfirmButton: false });
  };

  if (!open || !cotizacionId) return null;

  const titulo = cot?.codigo ?? listItem?.codigo ?? 'Cotización';
  const evento = cot?.eventos?.[0];
  const solicitud = cot?.solicitud;
  const link = cot ? linkPublicoCompleto(cot.tokenPublico) : '';
  const linkPdf = cot ? linkPdfPublicoCompleto(cot.tokenPublico) : '';

  const footer =
    cot && !isLoading ? (
      <DetalleActionsFooter>
        <DetalleActionGroup label="Compartir con el cliente">
          {puedeEnviarCotizacion(cot.etapa) && (
            <EnviarCotizacionActions
              cotizacionId={cot.id}
              etapa={cot.etapa}
              cliente={cot.cliente}
              className="w-full"
              preview={{
                codigo: cot.codigo,
                linkPublico: link,
                linkPdfPublico: linkPdf,
                nombreCliente: cot.cliente.nombreCompleto,
              }}
            />
          )}
          <Button variant="ghost" className="w-full" onClick={() => void copiarLink()}>
            Copiar link (aceptar)
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => void copiarLinkPdf()}>
            Copiar link PDF
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              if (!cot.cliente || !cot.cumpleanero) {
                void Swal.fire({
                  icon: 'warning',
                  title: 'Datos incompletos',
                  text: 'Espera a que cargue el detalle completo de la cotización.',
                });
                return;
              }
              const ok = imprimirCotizacionPdf(cot);
              if (!ok) {
                void Swal.fire({
                  icon: 'error',
                  title: 'No se pudo generar el PDF',
                  text: 'Permite ventanas emergentes en el navegador o vuelve a intentar.',
                });
              }
            }}
          >
            Descargar PDF
          </Button>
          {cot.etapa === 'borrador' && (
            <p className="text-center text-xs text-outline">
              Tras enviar, el cliente o el equipo pueden aceptar para crear el evento en Agenda.
            </p>
          )}
        </DetalleActionGroup>

        {(puedeAceptarCotizacion(cot.etapa) ||
          (puedeGenerarContrato(cot.etapa) && cot.eventos?.[0]?.id)) && (
          <DetalleActionGroup label="Confirmar flujo">
            {puedeAceptarCotizacion(cot.etapa) && (
              <AceptarCotizacionAction
                cotizacionId={cot.id}
                etapa={cot.etapa}
                fullWidth
                preferQuedarse
              />
            )}
            {puedeGenerarContrato(cot.etapa) && cot.eventos?.[0]?.id && (
              contratoEvento?.etapa === 'firmado' ? (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => navigate(`/contratos?detalle=${contratoEvento.id}`)}
                >
                  Ver contrato (firmado)
                </Button>
              ) : contratoEvento ? (
                <GenerarContratoAction
                  eventoId={cot.eventos[0].id}
                  cotizacionId={cot.id}
                  fullWidth
                  label="Ver / editar contrato"
                />
              ) : (
                <GenerarContratoAction
                  eventoId={cot.eventos[0].id}
                  cotizacionId={cot.id}
                  fullWidth
                />
              )
            )}
          </DetalleActionGroup>
        )}

        {puedeEditarCotizacionBorrador(cot.etapa) && (
          <DetalleActionGroup label="Editar">
            <Button
              variant="accent"
              className="w-full"
              onClick={() => {
                onClose();
                if (onEditarBorrador) onEditarBorrador(cot.id);
                else navigate(`/cotizaciones?editar=${cot.id}`);
              }}
            >
              Editar borrador
            </Button>
          </DetalleActionGroup>
        )}
      </DetalleActionsFooter>
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

          {(solicitud || evento || contratoEvento) && (
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
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-body-sm text-on-surface-variant">
                    Evento en Agenda ({evento.etapa === 'por_confirmar' ? 'por confirmar' : evento.etapa})
                  </span>
                  <Button
                    variant="ghost"
                    className="h-auto min-h-0 px-2 py-1 text-body-sm"
                    onClick={() => {
                      onClose();
                      navigate(`/agenda?detalle=${evento.id}`);
                    }}
                  >
                    Ver en Agenda
                  </Button>
                </div>
              )}
              {contratoEvento && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-body-sm text-on-surface-variant">
                    Contrato {contratoEvento.numero} ·{' '}
                    {ETAPA_CONTRATO_LABEL[contratoEvento.etapa] ?? contratoEvento.etapa}
                  </span>
                  <Button
                    variant="ghost"
                    className="h-auto min-h-0 px-2 py-1 text-body-sm"
                    onClick={() => navigate(`/contratos?detalle=${contratoEvento.id}`)}
                  >
                    Ver contrato
                  </Button>
                </div>
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
                <dt>Paquete base</dt>
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
              <h3 className="font-bold text-primary">Detalle de servicios</h3>
              <p className="mt-1 text-xs text-on-surface-variant">
                En piqueos, la cantidad indica packs; el tamaño del pack está en catálogo.
              </p>
              <ul className="mt-3 space-y-2">
                {cot.items.map((i) => {
                  const producto: Producto | undefined = i.productoId
                    ? productosById.get(i.productoId)
                    : undefined;
                  const origen = etiquetaOrigenItem(i.origenItem);
                  const cantidadTexto = descripcionCantidadProducto(producto, i.cantidad);

                  return (
                    <li key={i.id ?? `${i.nombre}-${i.origenItem}-${i.cantidad}`} className="flex justify-between gap-3">
                      <span className="min-w-0">
                        <span className="font-medium">{i.nombre}</span>{' '}
                        <span className="text-sm text-on-surface-variant">{cantidadTexto}</span>
                        {origen && (
                          <span
                            className={`ml-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                              i.origenItem === 'incluido_paquete'
                                ? 'bg-primary-fixed/40 text-primary'
                                : i.origenItem === 'excedente_paquete'
                                  ? 'bg-tertiary-fixed/50 text-tertiary'
                                  : 'bg-surface-container-high text-outline'
                            }`}
                          >
                            {origen}
                          </span>
                        )}
                        {i.creditoAplicado != null && i.creditoAplicado > 0 && (
                          <span className="ml-1 text-xs text-outline">
                            (crédito S/ {i.creditoAplicado.toFixed(2)})
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 font-semibold">
                        {i.precioUnitario <= 0 ? 'Incluido' : `S/ ${i.subtotal.toFixed(2)}`}
                      </span>
                    </li>
                  );
                })}
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
