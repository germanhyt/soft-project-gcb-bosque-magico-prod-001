import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Swal from 'sweetalert2';
import type { CotizacionFormTarget } from '../cotizaciones/CotizacionFormModal';
import { AceptarCotizacionAction } from '../cotizaciones/AceptarCotizacionAction';
import { EnviarCotizacionActions } from '../cotizaciones/EnviarCotizacionActions';
import { CerrarSolicitudModal } from './CerrarSolicitudModal';
import { SolicitudPreferenciasLanding } from './SolicitudPreferenciasLanding';
import {
  CANAL_LABEL,
  ETAPA_LABEL,
  MOTIVO_CIERRE_LABEL,
  TURNO_LABEL,
} from '../../constants/solicitudes';
import { INPUT_CLASS, LABEL_CLASS } from '../../constants/design';
import { AuditoriaTimeline } from '../auditoria/AuditoriaTimeline';
import { EtapaBadge } from '../ui/EtapaBadge';
import { Button } from '../ui/Button';
import { DetalleModal } from '../ui/DetalleModal';
import {
  actualizarSeguimiento,
  cerrarSolicitud,
  fetchSolicitud,
  generarCotizacionBorradorSolicitud,
  tomarSolicitud,
  type MotivoCierre,
  type Solicitud,
} from '../../lib/api';
import { formatFecha, formatFechaHora } from '../../lib/format';
import {
  cotizacionActivaDeSolicitud,
  esPosibleDuplicadoLanding,
  esSolicitudDesdeLanding,
  puedeCrearCotizacionManual,
  puedeGenerarBorradorDesdePayload,
} from '../../lib/solicitud-cotizacion';

type Props = {
  solicitudId: string | null;
  open: boolean;
  onClose: () => void;
  listItem?: Solicitud;
  onAbrirCotizacionForm?: (target: CotizacionFormTarget) => void;
  onEditarSolicitud?: (id: string) => void;
  onVerCotizacion?: (cotizacionId: string) => void;
};

function errorMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'response' in err) {
    return (
      String((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? '') ||
      fallback
    );
  }
  return fallback;
}

export function SolicitudDetalle({
  solicitudId,
  open,
  onClose,
  listItem,
  onAbrirCotizacionForm,
  onEditarSolicitud,
  onVerCotizacion,
}: Props) {
  const qc = useQueryClient();
  const [notas, setNotas] = useState('');
  const [proximoSeguimiento, setProximoSeguimiento] = useState('');
  const [cerrarOpen, setCerrarOpen] = useState(false);
  const [cerrarError, setCerrarError] = useState('');

  const isOpen = open && !!solicitudId;

  const { data: detalle, isLoading, isError } = useQuery({
    queryKey: ['solicitud', solicitudId],
    queryFn: () => fetchSolicitud(solicitudId!),
    enabled: isOpen,
    initialData: listItem,
  });

  const s = detalle;

  const invalidate = async () => {
    if (!solicitudId) return;
    await qc.invalidateQueries({ queryKey: ['solicitudes'] });
    await qc.invalidateQueries({ queryKey: ['solicitudes-resumen'] });
    await qc.invalidateQueries({ queryKey: ['solicitud', solicitudId] });
  };

  const tomarMut = useMutation({
    mutationFn: () => tomarSolicitud(solicitudId!),
    onSuccess: async () => {
      await invalidate();
      await Swal.fire({ icon: 'success', title: 'Solicitud en atención', timer: 1500, showConfirmButton: false });
    },
    onError: async (err: unknown) => {
      await Swal.fire({ icon: 'error', title: 'No se pudo tomar', text: errorMessage(err, '') || undefined });
    },
  });

  const cerrarMut = useMutation({
    mutationFn: ({ motivo, notas }: { motivo: MotivoCierre; notas?: string }) =>
      cerrarSolicitud(solicitudId!, { motivoCierre: motivo, notas }),
    onSuccess: async (res) => {
      setCerrarOpen(false);
      setCerrarError('');
      await invalidate();
      await qc.invalidateQueries({ queryKey: ['cotizaciones'] });
      onClose();
      const n = res.cotizacionesCerradas?.length ?? 0;
      await Swal.fire({
        icon: 'success',
        title: 'Solicitud cerrada',
        text:
          n > 0
            ? `También se cerraron ${n} cotización${n > 1 ? 'es' : ''} en borrador o enviada.`
            : undefined,
        timer: n > 0 ? undefined : 1500,
        showConfirmButton: n > 0,
      });
    },
    onError: (err: unknown) => {
      setCerrarError(errorMessage(err, 'No se pudo cerrar la solicitud'));
    },
  });

  const generarBorradorMut = useMutation({
    mutationFn: () => generarCotizacionBorradorSolicitud(solicitudId!),
    onSuccess: async (res) => {
      await invalidate();
      await qc.invalidateQueries({ queryKey: ['cotizaciones'] });
      await Swal.fire({
        icon: 'success',
        title: 'Borrador generado',
        text: res.cotizacion.codigo,
        timer: 2000,
        showConfirmButton: false,
      });
      onAbrirCotizacionForm?.({ mode: 'edit', cotizacionId: res.cotizacion.id });
    },
    onError: async (err: unknown) => {
      await Swal.fire({ icon: 'error', title: 'Error', text: errorMessage(err, 'No se pudo generar el borrador') });
    },
  });

  const seguimientoMut = useMutation({
    mutationFn: () =>
      actualizarSeguimiento(solicitudId!, {
        notas: notas.trim() || s?.notas || undefined,
        proximoSeguimientoEn: proximoSeguimiento
          ? new Date(proximoSeguimiento).toISOString()
          : undefined,
      }),
    onSuccess: async () => {
      await invalidate();
      setNotas('');
      setProximoSeguimiento('');
      await Swal.fire({ icon: 'success', title: 'Seguimiento guardado', timer: 1500, showConfirmButton: false });
    },
  });

  const cotizacionActiva = s ? cotizacionActivaDeSolicitud(s) : undefined;
  const mostrarCrearCotizacion = s ? puedeCrearCotizacionManual(s) : false;
  const mostrarGenerarBorrador = s ? puedeGenerarBorradorDesdePayload(s) : false;
  const labelCrearCotizacion =
    s && esSolicitudDesdeLanding(s) && !cotizacionActiva
      ? 'Completar cotización'
      : 'Crear cotización';

  const footer =
    s && s.etapa !== 'cerrada' ? (
      <div className="flex flex-col gap-2">
        {onEditarSolicitud ? (
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              onClose();
              onEditarSolicitud(solicitudId!);
            }}
          >
            Editar solicitud
          </Button>
        ) : null}
        {cotizacionActiva &&
        s &&
        (cotizacionActiva.etapa === 'borrador' || cotizacionActiva.etapa === 'enviada') ? (
          <EnviarCotizacionActions
            cotizacionId={cotizacionActiva.id}
            etapa={cotizacionActiva.etapa}
            cliente={{ celular: s.celular, correo: s.correo }}
          />
        ) : null}
        {cotizacionActiva ? (
          <AceptarCotizacionAction
            cotizacionId={cotizacionActiva.id}
            etapa={cotizacionActiva.etapa}
            fullWidth
            onSuccess={() => onClose()}
          />
        ) : null}
        {cotizacionActiva?.etapa === 'borrador' ? (
          <Button
            variant="accent"
            className="w-full"
            onClick={() => {
              onClose();
              onAbrirCotizacionForm?.({ mode: 'edit', cotizacionId: cotizacionActiva.id });
            }}
          >
            Editar cotización (borrador)
          </Button>
        ) : null}
        {cotizacionActiva ? (
          <Button
            variant={cotizacionActiva.etapa === 'borrador' ? 'ghost' : 'accent'}
            className="w-full"
            onClick={() => {
              onClose();
              onVerCotizacion?.(cotizacionActiva.id);
            }}
          >
            Ver cotización
          </Button>
        ) : null}
        {mostrarGenerarBorrador ? (
          <Button
            className="w-full"
            disabled={generarBorradorMut.isPending}
            onClick={() => generarBorradorMut.mutate()}
          >
            {generarBorradorMut.isPending
              ? 'Generando borrador…'
              : 'Generar borrador desde landing'}
          </Button>
        ) : null}
        {mostrarCrearCotizacion ? (
          <Button
            variant={cotizacionActiva ? 'ghost' : 'accent'}
            className="w-full"
            onClick={() => {
              onClose();
              onAbrirCotizacionForm?.({ mode: 'create', solicitudId: solicitudId! });
            }}
          >
            {labelCrearCotizacion}
          </Button>
        ) : null}
        {s.etapa === 'nueva' && (
          <Button className="w-full" disabled={tomarMut.isPending} onClick={() => tomarMut.mutate()}>
            Tomar solicitud
          </Button>
        )}
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => {
            setCerrarError('');
            setCerrarOpen(true);
          }}
          disabled={cerrarMut.isPending}
        >
          Cerrar solicitud
        </Button>
      </div>
    ) : undefined;

  const titulo = s?.nombreContacto ?? listItem?.nombreContacto ?? 'Solicitud';
  const descripcion =
    s || listItem
      ? `${CANAL_LABEL[(s ?? listItem)!.canal] ?? (s ?? listItem)!.canal} · ${(s ?? listItem)!.celular}`
      : undefined;

  return (
    <>
      <DetalleModal
        open={isOpen}
        onClose={onClose}
        title={titulo}
        description={descripcion}
        loading={isLoading && !s}
        footer={footer}
      >
        {isError && !s ? (
          <p className="text-error">No se pudo cargar la solicitud. Verifica la API e intenta de nuevo.</p>
        ) : s ? (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <EtapaBadge etapa={s.etapa} />
              <span className="text-on-surface-variant">{CANAL_LABEL[s.canal] ?? s.canal}</span>
              {esPosibleDuplicadoLanding(s) && (
                <span className="rounded-full bg-tertiary-fixed/50 px-2 py-0.5 text-xs font-semibold text-tertiary">
                  Posible duplicado
                </span>
              )}
            </div>
            <p className="text-title-md text-on-surface">{s.nombreContacto}</p>
            <p className="mt-1">{s.celular}</p>
            {s.correo && <p className="text-on-surface-variant">{s.correo}</p>}

            <dl className="mt-4 space-y-2">
              <div>
                <dt className="text-label-caps text-outline">Ingreso</dt>
                <dd>{formatFecha(s.fechaIngreso)}</dd>
              </div>
              <div>
                <dt className="text-label-caps text-outline">Fecha tentativa</dt>
                <dd>{formatFecha(s.fechaTentativa)}</dd>
              </div>
              {s.turnoInteres && (
                <div>
                  <dt className="text-label-caps text-outline">Turno</dt>
                  <dd>{TURNO_LABEL[s.turnoInteres]}</dd>
                </div>
              )}
              {s.cantidadNinosEstimada != null && (
                <div>
                  <dt className="text-label-caps text-outline">Niños</dt>
                  <dd>{s.cantidadNinosEstimada}</dd>
                </div>
              )}
              <div>
                <dt className="text-label-caps text-outline">Último contacto</dt>
                <dd>{formatFechaHora(s.ultimoContactoEn)}</dd>
              </div>
              <div>
                <dt className="text-label-caps text-outline">Próximo seguimiento</dt>
                <dd>{formatFechaHora(s.proximoSeguimientoEn)}</dd>
              </div>
              {s.motivoCierre && (
                <div>
                  <dt className="text-label-caps text-outline">Motivo cierre</dt>
                  <dd>{MOTIVO_CIERRE_LABEL[s.motivoCierre]}</dd>
                </div>
              )}
            </dl>

            <SolicitudPreferenciasLanding solicitud={s} />

            {cotizacionActiva && (
              <div className="mt-4 rounded-lg border border-primary/30 bg-primary-fixed/20 p-3">
                <p className="text-label-caps text-outline">Cotización vinculada</p>
                <p className="mt-1 font-semibold text-primary">{cotizacionActiva.codigo}</p>
                <p className="text-body-sm capitalize text-on-surface-variant">
                  Estado cotización: {cotizacionActiva.etapa.replace('_', ' ')}
                </p>
              </div>
            )}

            {s.notas && (
              <div className="mt-4 rounded-lg bg-surface-container-low p-3">
                <p className="text-label-caps text-outline">Notas</p>
                <p className="mt-1 whitespace-pre-wrap">{s.notas}</p>
              </div>
            )}

            <div className="mt-6 border-t border-surface-variant pt-4">
              <p className="mb-3 font-semibold text-primary">Bitácora</p>
              <AuditoriaTimeline tipoEntidad="solicitud" entidadId={solicitudId!} />
            </div>

            {s.etapa !== 'cerrada' && (
              <div className="mt-6 space-y-3 border-t border-surface-variant pt-4">
                <p className="font-semibold text-primary">Seguimiento</p>
                <textarea
                  rows={3}
                  placeholder={s.notas ?? 'Notas de seguimiento…'}
                  className={INPUT_CLASS}
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                />
                <label className="block">
                  <span className={LABEL_CLASS}>Próximo seguimiento</span>
                  <input
                    type="datetime-local"
                    className={INPUT_CLASS}
                    value={proximoSeguimiento}
                    onChange={(e) => setProximoSeguimiento(e.target.value)}
                  />
                </label>
                <Button
                  variant="ghost"
                  className="w-full"
                  disabled={seguimientoMut.isPending}
                  onClick={() => seguimientoMut.mutate()}
                >
                  Guardar seguimiento
                </Button>
              </div>
            )}
            {s.etapa === 'cerrada' && (
              <p className="mt-4 text-center text-body-sm text-outline">
                Estado: {ETAPA_LABEL[s.etapa]}
                {s.motivoCierre ? ` · ${MOTIVO_CIERRE_LABEL[s.motivoCierre]}` : ''}
              </p>
            )}
          </>
        ) : null}
      </DetalleModal>

      <CerrarSolicitudModal
        open={cerrarOpen}
        onClose={() => setCerrarOpen(false)}
        pending={cerrarMut.isPending}
        error={cerrarError}
        avisoCotizaciones={
          cotizacionActiva && cotizacionActiva.etapa !== 'cerrada' && cotizacionActiva.etapa !== 'aceptada'
            ? 'Las cotizaciones en borrador o enviada vinculadas pasarán a cerradas. Las aceptadas no se modifican.'
            : undefined
        }
        onConfirm={(motivo, notas) => cerrarMut.mutate({ motivo, notas })}
      />
    </>
  );
}
