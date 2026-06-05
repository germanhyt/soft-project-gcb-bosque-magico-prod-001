import { useMutation, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import { Button } from '../ui/Button';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';
import {
  enviarCotizacion,
  type EtapaCotizacion,
} from '../../lib/cotizaciones';

type ClienteContacto = { celular: string; correo?: string | null };

export function useEnviarCotizacionMutation(
  cotizacionId: string,
  cliente: ClienteContacto,
  onSuccess?: () => void,
) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (canal: 'whatsapp' | 'email') =>
      enviarCotizacion(cotizacionId, {
        canal,
        celularDestino: cliente.celular,
        correoDestino: cliente.correo ?? undefined,
      }),
    onSuccess: async (res, canal) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['cotizacion', cotizacionId] }),
        qc.invalidateQueries({ queryKey: ['cotizaciones'] }),
        qc.invalidateQueries({ queryKey: ['solicitudes'] }),
        qc.invalidateQueries({ queryKey: ['solicitudes-resumen'] }),
      ]);
      if (canal === 'whatsapp' && res.mensajePrearmado && cliente.celular) {
        const url = `https://wa.me/51${cliente.celular.replace(/\D/g, '')}?text=${encodeURIComponent(res.mensajePrearmado)}`;
        window.open(url, '_blank');
      }
      await Swal.fire({
        icon: 'success',
        title: 'Cotización enviada',
        html: `<p class="text-sm">Estado: <strong>Enviada</strong>. El cliente puede aceptar desde el link o el equipo con <strong>Aceptar (equipo)</strong>.</p>`,
        timer: 2200,
        showConfirmButton: false,
      });
      onSuccess?.();
    },
    onError: async (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? '')
          : 'No se pudo enviar';
      await Swal.fire({ icon: 'error', title: 'Error', text: msg || undefined });
    },
  });
}

type Props = {
  cotizacionId: string;
  etapa: EtapaCotizacion;
  cliente: ClienteContacto;
  className?: string;
  onSuccess?: () => void;
};

export function EnviarCotizacionActions({
  cotizacionId,
  etapa,
  cliente,
  className = '',
  onSuccess,
}: Props) {
  const puedeEnviar = etapa === 'borrador' || etapa === 'enviada';
  const enviarMut = useEnviarCotizacionMutation(cotizacionId, cliente, onSuccess);

  if (!puedeEnviar) return null;

  return (
    <div className={`flex flex-col gap-2 sm:flex-row sm:flex-wrap ${className}`}>
      <Button
        className="inline-flex gap-2 sm:flex-1"
        disabled={enviarMut.isPending}
        onClick={() => enviarMut.mutate('whatsapp')}
      >
        <WhatsAppIcon size={20} className="text-on-primary" />
        {etapa === 'borrador' ? 'Enviar por WhatsApp' : 'Reenviar por WhatsApp'}
      </Button>
      {cliente.correo && (
        <Button
          variant="secondary"
          className="sm:flex-1"
          disabled={enviarMut.isPending}
          onClick={() => enviarMut.mutate('email')}
        >
          {etapa === 'borrador' ? 'Enviar por correo' : 'Reenviar por correo'}
        </Button>
      )}
    </div>
  );
}
