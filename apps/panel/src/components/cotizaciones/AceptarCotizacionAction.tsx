import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Button } from '../ui/Button';
import { aceptarCotizacionPanel, type EtapaCotizacion } from '../../lib/cotizaciones';

function invalidateTrasAceptar(qc: ReturnType<typeof useQueryClient>, cotizacionId: string) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: ['cotizacion', cotizacionId] }),
    qc.invalidateQueries({ queryKey: ['cotizaciones'] }),
    qc.invalidateQueries({ queryKey: ['solicitudes'] }),
    qc.invalidateQueries({ queryKey: ['solicitudes-resumen'] }),
    qc.invalidateQueries({ queryKey: ['eventos-resumen'] }),
    qc.invalidateQueries({ queryKey: ['agenda'] }),
  ]);
}

export async function confirmarAceptacionCotizacion() {
  const confirm = await Swal.fire({
    icon: 'question',
    title: '¿Aceptar cotización?',
    html: `<p class="text-sm text-left">Úsalo cuando el cliente ya confirmó (por teléfono, WhatsApp u otro canal). Se creará el evento en Agenda.</p>`,
    showCancelButton: true,
    confirmButtonText: 'Sí, aceptar',
    cancelButtonText: 'Cancelar',
  });
  return confirm.isConfirmed;
}

type AceptarCotizacionOptions = {
  /** Si true, el botón principal cierra la alerta y deja al usuario en pantalla (p. ej. generar contrato). */
  preferQuedarse?: boolean;
};

export function useAceptarCotizacionMutation(
  cotizacionId: string,
  onSuccess?: (eventoId?: string) => void,
  options?: AceptarCotizacionOptions,
) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const preferQuedarse = options?.preferQuedarse ?? false;

  return useMutation({
    mutationFn: () => aceptarCotizacionPanel(cotizacionId),
    onSuccess: async (res: { eventoId?: string }) => {
      await invalidateTrasAceptar(qc, cotizacionId);

      if (!res.eventoId) {
        await Swal.fire({
          icon: 'success',
          title: 'Cotización aceptada',
          confirmButtonText: 'Entendido',
        });
        onSuccess?.(res.eventoId);
        return;
      }

      const htmlQuedarse = preferQuedarse
        ? '<p class="text-sm">Se creó el evento en <strong>Agenda</strong> (por confirmar). Puedes generar el contrato desde aquí o ir a Agenda.</p>'
        : '<p class="text-sm">Se creó el evento en <strong>Agenda</strong> (por confirmar).</p>';

      const result = await Swal.fire({
        icon: 'success',
        title: 'Cotización aceptada',
        html: htmlQuedarse,
        showCancelButton: true,
        confirmButtonText: 'Continuar aquí',
        cancelButtonText: 'Ir a Agenda',
        reverseButtons: true,
      });

      if (result.dismiss === Swal.DismissReason.cancel) {
        navigate(`/agenda?detalle=${res.eventoId}`);
      }
      onSuccess?.(res.eventoId);
    },
    onError: async (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? '')
          : 'No se pudo aceptar';
      await Swal.fire({ icon: 'error', title: 'No se pudo aceptar', text: msg || undefined });
    },
  });
}

type Props = {
  cotizacionId: string;
  etapa: EtapaCotizacion;
  className?: string;
  fullWidth?: boolean;
  /** Mantener el detalle abierto tras aceptar (p. ej. para generar contrato). */
  preferQuedarse?: boolean;
  onSuccess?: (eventoId?: string) => void;
};

export function AceptarCotizacionAction({
  cotizacionId,
  etapa,
  className = '',
  fullWidth = false,
  preferQuedarse = false,
  onSuccess,
}: Props) {
  const aceptarMut = useAceptarCotizacionMutation(cotizacionId, onSuccess, {
    preferQuedarse,
  });

  if (etapa !== 'enviada') return null;

  const confirmarYAceptar = async () => {
    if (await confirmarAceptacionCotizacion()) aceptarMut.mutate();
  };

  return (
    <Button
      variant="accent"
      className={`${fullWidth ? 'w-full' : 'sm:flex-1'} ${className}`}
      disabled={aceptarMut.isPending}
      onClick={() => void confirmarYAceptar()}
    >
      {aceptarMut.isPending ? 'Aceptando…' : 'Aceptar (equipo)'}
    </Button>
  );
}
