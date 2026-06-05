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

export function useAceptarCotizacionMutation(
  cotizacionId: string,
  onSuccess?: (eventoId?: string) => void,
) {
  const qc = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => aceptarCotizacionPanel(cotizacionId),
    onSuccess: async (res: { eventoId?: string }) => {
      await invalidateTrasAceptar(qc, cotizacionId);
      const result = await Swal.fire({
        icon: 'success',
        title: 'Cotización aceptada',
        html: res.eventoId
          ? '<p class="text-sm">Se creó el evento en <strong>Agenda</strong> (por confirmar).</p>'
          : undefined,
        showCancelButton: !!res.eventoId,
        confirmButtonText: res.eventoId ? 'Ir a Agenda' : 'Entendido',
        cancelButtonText: 'Cerrar',
      });
      if (res.eventoId && result.isConfirmed) {
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
  onSuccess?: (eventoId?: string) => void;
};

export function AceptarCotizacionAction({
  cotizacionId,
  etapa,
  className = '',
  fullWidth = false,
  onSuccess,
}: Props) {
  const aceptarMut = useAceptarCotizacionMutation(cotizacionId, onSuccess);

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
