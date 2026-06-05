import { useMutation, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import { Button } from '../ui/Button';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';
import { imprimirCotizacionPdf } from '../../lib/cotizacion-print';
import {
  enviarCotizacion,
  fetchCotizacion,
  type EtapaCotizacion,
} from '../../lib/cotizaciones';

type ClienteContacto = { celular: string; correo?: string | null };

type EnviarOpts = { canal: 'whatsapp' | 'email'; withPdf?: boolean };

export function useEnviarCotizacionMutation(
  cotizacionId: string,
  cliente: ClienteContacto,
  onSuccess?: () => void,
) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ canal }: EnviarOpts) =>
      enviarCotizacion(cotizacionId, {
        canal,
        celularDestino: cliente.celular,
        correoDestino: cliente.correo ?? undefined,
      }),
    onSuccess: async (res, { canal, withPdf }) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['cotizacion', cotizacionId] }),
        qc.invalidateQueries({ queryKey: ['cotizaciones'] }),
        qc.invalidateQueries({ queryKey: ['solicitudes'] }),
        qc.invalidateQueries({ queryKey: ['solicitudes-resumen'] }),
      ]);

      if (canal === 'whatsapp' && withPdf) {
        try {
          const cot = await fetchCotizacion(cotizacionId);
          const ok = imprimirCotizacionPdf(cot);
          if (!ok) {
            await Swal.fire({
              icon: 'warning',
              title: 'PDF no generado',
              text: 'Permite ventanas emergentes para descargar el PDF antes de WhatsApp.',
            });
          } else {
            await new Promise((r) => setTimeout(r, 600));
          }
        } catch {
          await Swal.fire({
            icon: 'warning',
            title: 'No se pudo generar el PDF',
            text: 'Puedes descargarlo desde el detalle de la cotización.',
          });
        }
      }

      if (canal === 'whatsapp' && res.mensajePrearmado && cliente.celular) {
        const url = `https://wa.me/51${cliente.celular.replace(/\D/g, '')}?text=${encodeURIComponent(res.mensajePrearmado)}`;
        window.open(url, '_blank');
      }

      await Swal.fire({
        icon: 'success',
        title: 'Cotización enviada',
        html: `<p class="text-sm">Estado: <strong>Enviada</strong>. El link público ya apunta a la landing de sandbox.</p>`,
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

  const enviarWhatsApp = async () => {
    const choice = await Swal.fire({
      icon: 'question',
      title: 'Enviar por WhatsApp',
      html: `<p class="text-sm text-left">WhatsApp no adjunta archivos automáticamente desde el navegador. Puedes generar el PDF ahora y adjuntarlo manualmente en el chat.</p>`,
      showCancelButton: true,
      confirmButtonText: 'PDF + WhatsApp',
      cancelButtonText: 'Solo mensaje',
      reverseButtons: true,
    });
    if (choice.isDismissed) return;
    enviarMut.mutate({ canal: 'whatsapp', withPdf: choice.isConfirmed });
  };

  if (!puedeEnviar) return null;

  return (
    <div className={`flex flex-col gap-2 sm:flex-row sm:flex-wrap ${className}`}>
      <Button
        className="inline-flex gap-2 sm:flex-1"
        disabled={enviarMut.isPending}
        onClick={() => void enviarWhatsApp()}
      >
        <WhatsAppIcon size={20} className="text-on-primary" />
        {etapa === 'borrador' ? 'Enviar por WhatsApp' : 'Reenviar por WhatsApp'}
      </Button>
      {cliente.correo && (
        <Button
          variant="secondary"
          className="sm:flex-1"
          disabled={enviarMut.isPending}
          onClick={() => enviarMut.mutate({ canal: 'email' })}
        >
          {etapa === 'borrador' ? 'Enviar por correo' : 'Reenviar por correo'}
        </Button>
      )}
    </div>
  );
}
