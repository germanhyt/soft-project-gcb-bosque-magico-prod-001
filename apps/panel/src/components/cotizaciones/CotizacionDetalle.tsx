import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { AuditoriaTimeline } from '../auditoria/AuditoriaTimeline';
import { CerrarSolicitudModal } from '../solicitudes/CerrarSolicitudModal';
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
  volverCotizacionABorrador,
  type Cotizacion,
  type ItemCotizacion,
  type Producto,
} from '../../lib/cotizaciones';
import { fetchContratoEvento } from '../../lib/contratos';
import { ETAPA_CONTRATO_LABEL } from '../../constants/contratos';
import { agruparItemsPorOrigen, descripcionCantidadProducto } from '../../lib/origen-item';
import { GenerarContratoAction } from '../contratos/GenerarContratoAction';
import { DetalleActionGroup, DetalleActionHint, DetalleActionsFooter } from '../ui/DetalleActionGroup';
import { imprimirCotizacionPdf } from '../../lib/cotizacion-print';
import {
  puedeAceptarCotizacion,
  puedeCerrarSolicitudDesdeCotizacion,
  puedeEditarCotizacionBorrador,
  puedeEnviarCotizacion,
  puedeGenerarContrato,
  puedeVolverABorradorCotizacion,
} from '../../lib/flujo-estados';
import { formatFecha } from '../../lib/format';
import { apiErrorMessage } from '../../lib/api-error';
import { cerrarSolicitud, type MotivoCierre } from '../../lib/api';

type Props = {
  cotizacionId: string | null;
  listItem?: Cotizacion;
  open: boolean;
  onClose: () => void;
  onAbrirSolicitud?: () => void;
  onEditarBorrador?: (id: string) => void;
};

function horarioDesdeNotas(notas?: string | null): string | null {
  if (!notas?.includes('Horario:')) return null;
  const texto = notas.replace(/^.*?(Horario:)/, 'Horario:').trim();
  return texto || null;
}

function FilaServicio({
  item,
  producto,
  indent = false,
}: {
  item: ItemCotizacion;
  producto?: Producto;
  indent?: boolean;
}) {
  const productoCantidad =
    producto ??
    (item.subtipo === 'piqueo' || item.subtipo === 'cajita' || item.subtipo === 'snack'
      ? { subtipo: item.subtipo, unidadesPack: item.unidadesPack }
      : undefined);
  const cantidadTexto = descripcionCantidadProducto(productoCantidad, item.cantidad);
  const horario = horarioDesdeNotas(item.notas);

  return (
    <li className={`flex justify-between gap-3 py-1.5 ${indent ? 'pl-3' : ''}`}>
      <span className="min-w-0">
        <span className="font-medium">{item.nombre}</span>{' '}
        <span className="text-sm text-on-surface-variant">{cantidadTexto}</span>
        {item.creditoAplicado != null && item.creditoAplicado > 0 && (
          <span className="ml-1 text-xs text-outline">
            (crédito S/ {item.creditoAplicado.toFixed(2)})
          </span>
        )}
        {horario ? <span className="mt-0.5 block text-xs text-outline">{horario}</span> : null}
      </span>
      <span className="shrink-0 font-semibold">
        {item.precioUnitario <= 0 ? 'Incluido' : `S/ ${item.subtotal.toFixed(2)}`}
      </span>
    </li>
  );
}

function SeccionServicios({
  titulo,
  items,
  productosById,
  indent = false,
}: {
  titulo: string;
  items: ItemCotizacion[];
  productosById: Map<string, Producto>;
  indent?: boolean;
}) {
  if (!items.length) return null;
  return (
    <div>
      <p className="text-label-caps text-outline">{titulo}</p>
      <ul className="mt-0.5 divide-y divide-surface-variant/50">
        {items.map((item) => (
          <FilaServicio
            key={item.id ?? `${item.nombre}-${item.origenItem}-${item.cantidad}`}
            item={item}
            producto={item.productoId ? productosById.get(item.productoId) : undefined}
            indent={indent}
          />
        ))}
      </ul>
    </div>
  );
}

export function CotizacionDetalle({
  cotizacionId,
  listItem,
  open,
  onClose,
  onAbrirSolicitud,
  onEditarBorrador,
}: Props) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [cerrarOpen, setCerrarOpen] = useState(false);
  const [cerrarError, setCerrarError] = useState('');
  const volverMut = useMutation({
    mutationFn: () => volverCotizacionABorrador(cotizacionId!),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['cotizacion', cotizacionId] }),
        qc.invalidateQueries({ queryKey: ['cotizaciones'] }),
      ]);
      await Swal.fire({
        icon: 'success',
        title: 'Volvió a borrador',
        text: 'El cliente ya no puede aceptar. Edita y vuelve a enviar cuando esté lista.',
      });
    },
    onError: async (err) => {
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo volver a borrador',
        text: apiErrorMessage(err, 'Inténtalo de nuevo'),
      });
    },
  });

  const cerrarMut = useMutation({
    mutationFn: ({ motivo, notas }: { motivo: MotivoCierre; notas?: string }) =>
      cerrarSolicitud(cot!.solicitudId ?? cot!.solicitud!.id, {
        motivoCierre: motivo,
        notas,
      }),
    onSuccess: async (res) => {
      setCerrarOpen(false);
      setCerrarError('');
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['cotizacion', cotizacionId] }),
        qc.invalidateQueries({ queryKey: ['cotizaciones'] }),
        qc.invalidateQueries({ queryKey: ['solicitudes'] }),
        qc.invalidateQueries({ queryKey: ['solicitudes-resumen'] }),
        qc.invalidateQueries({ queryKey: ['solicitud', cot?.solicitudId ?? cot?.solicitud?.id] }),
      ]);
      const n = res.cotizacionesCerradas?.length ?? 0;
      await Swal.fire({
        icon: 'success',
        title: 'Solicitud cerrada',
        text:
          n > 0
            ? `Se cerraron ${n} cotización${n > 1 ? 'es' : ''} en borrador o enviada. El cliente ya no puede aceptar.`
            : undefined,
      });
    },
    onError: (err: unknown) => {
      setCerrarError(apiErrorMessage(err, 'No se pudo cerrar la solicitud'));
    },
  });

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

  if (!open || !cotizacionId) return null;

  const titulo = cot?.codigo ?? listItem?.codigo ?? 'Cotización';
  const evento = cot?.eventos?.[0];
  const solicitud = cot?.solicitud;
  const solicitudId = cot?.solicitudId ?? solicitud?.id ?? null;
  const puedeCerrarSolicitud = puedeCerrarSolicitudDesdeCotizacion(
    cot?.etapa ?? 'cerrada',
    solicitudId,
    solicitud?.etapa,
  );
  const link = cot ? linkPublicoCompleto(cot.tokenPublico) : '';
  const linkPdf = cot ? linkPdfPublicoCompleto(cot.tokenPublico) : '';
  const gruposServicios = agruparItemsPorOrigen(cot?.items ?? []);

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
            {cot.etapa === 'borrador' ? 'Copiar link (vista previa)' : 'Copiar link (aceptar)'}
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
            <DetalleActionHint>
              Este enlace es de borrador: el cliente no puede aceptar. Envía la cotización para habilitar la aceptación.
            </DetalleActionHint>
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
                  nested
                  redirectToContratos={false}
                  label="Ver / editar contrato"
                />
              ) : (
                <GenerarContratoAction
                  eventoId={cot.eventos[0].id}
                  cotizacionId={cot.id}
                  fullWidth
                  nested
                  redirectToContratos={false}
                />
              )
            )}
          </DetalleActionGroup>
        )}

        {puedeEditarCotizacionBorrador(cot.etapa) && (
          <DetalleActionGroup label="Editar">
            <Button
              variant="accent"
              className="col-span-2"
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
        {puedeVolverABorradorCotizacion(cot.etapa) && (
          <DetalleActionGroup label="Corregir propuesta">
            <Button
              variant="ghost"
              className="col-span-2"
              disabled={volverMut.isPending}
              onClick={() => {
                void (async () => {
                  const ok = await Swal.fire({
                    icon: 'question',
                    title: '¿Volver a borrador?',
                    text: 'El cliente dejará de poder aceptar. El mismo enlace se actualizará cuando reenvíes.',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, volver a borrador',
                    cancelButtonText: 'Cancelar',
                  });
                  if (ok.isConfirmed) volverMut.mutate();
                })();
              }}
            >
              {volverMut.isPending ? 'Cambiando…' : 'Volver a borrador'}
            </Button>
          </DetalleActionGroup>
        )}
        {puedeCerrarSolicitud ? (
          <DetalleActionGroup label="Cerrar lead">
            <Button
              variant="ghost"
              className="col-span-2"
              onClick={() => {
                setCerrarError('');
                setCerrarOpen(true);
              }}
            >
              Cerrar solicitud
            </Button>
            <DetalleActionHint>
              Cierra el lead. Esta y otras propuestas en borrador o enviada quedarán cerradas. Las
              aceptadas no se tocan.
            </DetalleActionHint>
          </DetalleActionGroup>
        ) : null}
      </DetalleActionsFooter>
    ) : undefined;

  return (
    <>
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
            <div className={`flex flex-wrap items-center gap-3 p-4 ${CARD_CLASS}`}>
              {solicitud ? (
                <div className="flex flex-wrap items-center gap-2">
                  {onAbrirSolicitud ? (
                    <button
                      type="button"
                      className="text-body-sm font-semibold text-primary hover:underline"
                      onClick={onAbrirSolicitud}
                    >
                      Solicitud: {solicitud.nombreContacto}
                    </button>
                  ) : (
                    <span className="text-body-sm text-on-surface-variant">
                      Solicitud: {solicitud.nombreContacto}
                    </span>
                  )}
                  {puedeCerrarSolicitud ? (
                    <Button
                      variant="ghost"
                      className="h-auto min-h-0 px-2 py-1 text-body-sm"
                      onClick={() => {
                        setCerrarError('');
                        setCerrarOpen(true);
                      }}
                    >
                      Cerrar solicitud
                    </Button>
                  ) : null}
                </div>
              ) : null}
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
              Borrador: puedes compartir el PDF para negociar, pero el cliente no puede aceptar hasta que envíes la cotización.
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
            <div className={`space-y-4 p-4 ${CARD_CLASS}`}>
              <div>
                <h3 className="font-bold text-primary">Detalle de servicios</h3>
                {cot.items.some(
                  (i) =>
                    i.subtipo === 'piqueo' ||
                    (i.productoId ? productosById.get(i.productoId)?.subtipo === 'piqueo' : false),
                ) ? (
                  <p className="mt-1 text-xs text-on-surface-variant">
                    En piqueos, la cantidad indica packs; el tamaño del pack está en catálogo.
                  </p>
                ) : null}
              </div>
              {cot.paquete ? (
                <div className="flex justify-between gap-3 border-b border-surface-variant pb-3">
                  <span>
                    <span className="font-semibold">Paquete {cot.paquete}</span>
                    <span className="mt-0.5 block text-xs text-on-surface-variant">
                      Espacio y servicios incluidos
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold">S/ {cot.montoBase.toFixed(2)}</span>
                </div>
              ) : null}
              <SeccionServicios
                titulo="Incluido en el paquete"
                items={gruposServicios.incluidos}
                productosById={productosById}
                indent
              />
              <SeccionServicios
                titulo="Excedentes del paquete"
                items={gruposServicios.excedentes}
                productosById={productosById}
              />
              <SeccionServicios
                titulo="Adicionales"
                items={gruposServicios.adicionales}
                productosById={productosById}
              />
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

      <CerrarSolicitudModal
        open={cerrarOpen}
        onClose={() => setCerrarOpen(false)}
        nested
        pending={cerrarMut.isPending}
        error={cerrarError}
        avisoCotizaciones="Las cotizaciones en borrador o enviada de este lead pasarán a cerradas. El cliente ya no podrá aceptar. Las aceptadas no se modifican."
        onConfirm={(motivo, notas) => cerrarMut.mutate({ motivo, notas })}
      />
    </>
  );
}
