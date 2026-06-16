import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { ContactoInlineActions } from '../contacto/ContactoInlineActions';
import { RowActionDivider, RowActionsToolbar } from '../ui/RowActionsToolbar';
import { RowIconButton } from '../ui/RowIconButton';
import type { CotizacionFormTarget } from '../cotizaciones/CotizacionFormModal';
import { CerrarSolicitudModal } from './CerrarSolicitudModal';
import {
  cerrarSolicitud,
  generarCotizacionBorradorSolicitud,
  tomarSolicitud,
  type MotivoCierre,
  type Solicitud,
} from '../../lib/api';
import {
  cotizacionActivaDeSolicitud,
  esSolicitudDesdeLanding,
  puedeCrearCotizacionManual,
  puedeGenerarBorradorDesdePayload,
} from '../../lib/solicitud-cotizacion';

type Props = {
  solicitud: Solicitud;
  onVer: (id: string) => void;
  onAbrirCotizacionForm?: (target: CotizacionFormTarget) => void;
  onEditarSolicitud?: (id: string) => void;
};

function errorMsg(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'response' in err) {
    return (
      String((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? '') ||
      fallback
    );
  }
  return fallback;
}

export function SolicitudRowActions({
  solicitud,
  onVer,
  onAbrirCotizacionForm,
  onEditarSolicitud,
}: Props) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [cerrarOpen, setCerrarOpen] = useState(false);
  const [cerrarError, setCerrarError] = useState('');

  const invalidate = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['solicitudes'] }),
      qc.invalidateQueries({ queryKey: ['solicitudes-resumen'] }),
      qc.invalidateQueries({ queryKey: ['solicitud', solicitud.id] }),
    ]);

  const tomarMut = useMutation({
    mutationFn: () => tomarSolicitud(solicitud.id),
    onSuccess: async () => {
      await invalidate();
      await Swal.fire({ icon: 'success', title: 'Solicitud en atención', timer: 1400, showConfirmButton: false });
    },
    onError: async (err: unknown) => {
      await Swal.fire({ icon: 'error', title: 'No se pudo tomar', text: errorMsg(err, '') || undefined });
    },
  });

  const generarBorradorMut = useMutation({
    mutationFn: () => generarCotizacionBorradorSolicitud(solicitud.id),
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
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo generar borrador',
        text: errorMsg(err, ''),
      });
    },
  });

  const cerrarMut = useMutation({
    mutationFn: ({ motivo, notas }: { motivo: MotivoCierre; notas?: string }) =>
      cerrarSolicitud(solicitud.id, { motivoCierre: motivo, notas }),
    onSuccess: async (res) => {
      setCerrarOpen(false);
      setCerrarError('');
      await invalidate();
      await qc.invalidateQueries({ queryKey: ['cotizaciones'] });
      const n = res.cotizacionesCerradas?.length ?? 0;
      await Swal.fire({
        icon: 'success',
        title: 'Solicitud cerrada',
        text:
          n > 0
            ? `También se cerraron ${n} cotización${n > 1 ? 'es' : ''} en borrador o enviada.`
            : undefined,
        timer: n > 0 ? undefined : 1400,
        showConfirmButton: n > 0,
      });
    },
    onError: (err: unknown) => setCerrarError(errorMsg(err, 'No se pudo cerrar la solicitud')),
  });

  const esCerrada = solicitud.etapa === 'cerrada';
  const cotizacionActiva = cotizacionActivaDeSolicitud(solicitud);
  const pending =
    tomarMut.isPending || generarBorradorMut.isPending || cerrarMut.isPending;

  const refCopiar = `Solicitud ${solicitud.id.slice(0, 8)} · ${solicitud.nombreContacto}`;

  return (
    <>
      <RowActionsToolbar>
        <ContactoInlineActions
          nombre={solicitud.nombreContacto}
          celular={solicitud.celular}
          correo={solicitud.correo}
          enlaceCopiar={refCopiar}
          enlaceTitulo="Copiar referencia de solicitud"
        />
        <RowActionDivider />
        <RowIconButton
          icon="visibility"
          title="Ver detalle"
          aria-label="Ver detalle"
          onClick={() => onVer(solicitud.id)}
        />
        {!esCerrada && onEditarSolicitud && (
          <RowIconButton
            icon="edit_square"
            title="Editar solicitud"
            aria-label="Editar solicitud"
            onClick={() => onEditarSolicitud(solicitud.id)}
          />
        )}
        {(!esCerrada &&
          (onEditarSolicitud ||
            cotizacionActiva?.etapa === 'borrador' ||
            cotizacionActiva ||
            puedeGenerarBorradorDesdePayload(solicitud) ||
            puedeCrearCotizacionManual(solicitud))) && <RowActionDivider />}

        {solicitud.etapa === 'nueva' && (
          <RowIconButton
            icon="how_to_reg"
            title="Tomar solicitud"
            aria-label="Tomar solicitud"
            disabled={pending}
            onClick={() => tomarMut.mutate()}
          />
        )}

        {!esCerrada && cotizacionActiva && (
          <RowIconButton
            icon="receipt_long"
            title="Revisar cotización"
            aria-label="Revisar cotización"
            onClick={() => navigate(`/cotizaciones?detalle=${cotizacionActiva.id}`)}
          />
        )}
        {!esCerrada && cotizacionActiva?.etapa === 'borrador' && (
          <RowIconButton
            icon="edit"
            title="Editar cotización en borrador"
            aria-label="Editar cotización en borrador"
            onClick={() =>
              onAbrirCotizacionForm
                ? onAbrirCotizacionForm({ mode: 'edit', cotizacionId: cotizacionActiva.id })
                : navigate(`/cotizaciones?editar=${cotizacionActiva.id}`)
            }
          />
        )}
        {!esCerrada && puedeGenerarBorradorDesdePayload(solicitud) && (
          <RowIconButton
            icon="auto_fix_high"
            title="Generar borrador desde landing"
            aria-label="Generar borrador"
            disabled={pending}
            onClick={() => generarBorradorMut.mutate()}
          />
        )}
        {!esCerrada && puedeCrearCotizacionManual(solicitud) && (
          <RowIconButton
            icon="add_circle"
            title={
              esSolicitudDesdeLanding(solicitud) ? 'Completar cotización' : 'Crear cotización'
            }
            aria-label="Crear cotización"
            onClick={() =>
              onAbrirCotizacionForm
                ? onAbrirCotizacionForm({ mode: 'create', solicitudId: solicitud.id })
                : navigate(`/cotizaciones?form=nueva&solicitudId=${solicitud.id}`)
            }
          />
        )}
        {!esCerrada && (
          <>
            <RowActionDivider />
            <RowIconButton
              variant="danger"
              icon="cancel"
              title="Cerrar solicitud"
              aria-label="Cerrar solicitud"
              disabled={pending}
              onClick={() => {
                setCerrarError('');
                setCerrarOpen(true);
              }}
            />
          </>
        )}
      </RowActionsToolbar>

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
