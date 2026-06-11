import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Swal from 'sweetalert2';
import { Button } from '../ui/Button';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';
import { imprimirCotizacionPdf } from '../../lib/cotizacion-print';
import { invalidarTrasEnviarCotizacion } from '../../lib/enviar-cotizacion-correo';
import { fetchConfiguracionPanel } from '../../lib/configuracion';
import {
  enviarCotizacion,
  fetchCotizacion,
  type EtapaCotizacion,
} from '../../lib/cotizaciones';
import { parseSmtpEstado } from '../../lib/smtp-config';
import { abrirWhatsApp, waMeUrlCotizacion } from '../../lib/whatsapp-cotizacion';
import { puedeEnviarCotizacion } from '../../lib/flujo-estados';
import { EnviarCotizacionCorreoModal } from './EnviarCotizacionCorreoModal';

type ClienteContacto = { celular: string; correo?: string | null; nombreCompleto?: string };

type EnviarOpts = { canal: 'whatsapp' | 'email' };

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
    onSuccess: async () => {
      await invalidarTrasEnviarCotizacion(qc, cotizacionId);
      onSuccess?.();
    },
    onError: async (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? '')
          : err instanceof Error
            ? err.message
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
  preview?: { codigo?: string; linkPublico?: string; nombreCliente?: string };
};

export function EnviarCotizacionActions({
  cotizacionId,
  etapa,
  cliente,
  className = '',
  onSuccess,
  preview,
}: Props) {
  const qc = useQueryClient();
  const [enviandoWa, setEnviandoWa] = useState(false);
  const [correoModalOpen, setCorreoModalOpen] = useState(false);
  const puedeEnviar = puedeEnviarCotizacion(etapa);

  const { data: smtpActivo = false } = useQuery({
    queryKey: ['config-panel'],
    queryFn: fetchConfiguracionPanel,
    select: (data) => (data.meta?.smtp ?? parseSmtpEstado(data.smtp)).activo,
    staleTime: 60_000,
  });

  const enviarWhatsApp = async (withPdf: boolean, waTab: Window | null) => {
    setEnviandoWa(true);
    try {
      const res = await enviarCotizacion(cotizacionId, {
        canal: 'whatsapp',
        celularDestino: cliente.celular,
        correoDestino: cliente.correo ?? undefined,
      });
      await invalidarTrasEnviarCotizacion(qc, cotizacionId);

      if (res.mensajePrearmado && cliente.celular) {
        const waUrl = waMeUrlCotizacion(cliente.celular, res.mensajePrearmado);
        const abierto = abrirWhatsApp(waUrl, waTab);
        if (!abierto) {
          await Swal.fire({
            icon: 'info',
            title: 'Abrir WhatsApp',
            html: `<p class="text-sm mb-3">El navegador bloqueó la ventana emergente.</p><a href="${waUrl}" target="_blank" rel="noopener" class="text-primary underline">Abrir WhatsApp manualmente</a>`,
          });
        }
      } else {
        waTab?.close();
      }

      if (withPdf) {
        const cot = await fetchCotizacion(cotizacionId);
        const ok = imprimirCotizacionPdf(cot, 'iframe');
        if (!ok) {
          await Swal.fire({
            icon: 'warning',
            title: 'PDF no generado',
            text: 'WhatsApp ya se abrió con el link. Puedes descargar el PDF desde el detalle.',
          });
        }
      }

      await Swal.fire({
        icon: 'success',
        title: 'Cotización enviada',
        html: withPdf
          ? '<p class="text-sm">WhatsApp abierto con el link. Adjunta el PDF desde el diálogo de impresión.</p>'
          : '<p class="text-sm">WhatsApp abierto con el mensaje y link de la cotización.</p>',
        timer: 2400,
        showConfirmButton: false,
      });
      onSuccess?.();
    } catch (err: unknown) {
      waTab?.close();
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? '')
          : 'No se pudo enviar';
      await Swal.fire({ icon: 'error', title: 'Error', text: msg || undefined });
    } finally {
      setEnviandoWa(false);
    }
  };

  const preguntarYEnviarWhatsApp = async () => {
    const choice = await Swal.fire({
      icon: 'question',
      title: 'Enviar por WhatsApp',
      html: `<p class="text-sm text-left">Se abrirá WhatsApp con el link de la cotización. Opcionalmente puedes generar el PDF para adjuntarlo manualmente en el chat.</p>`,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'PDF + WhatsApp',
      denyButtonText: 'Solo mensaje',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    });

    if (choice.isDismissed) return;
    const withPdf = choice.isConfirmed;
    const waTab = window.open('about:blank', '_blank');
    await enviarWhatsApp(withPdf, waTab);
  };

  if (!puedeEnviar) return null;

  const pendiente = enviandoWa;
  const labelCorreo =
    etapa === 'borrador' ? 'Enviar por correo' : 'Reenviar por correo';

  return (
    <>
      <div className={`flex flex-col gap-2 sm:flex-row sm:flex-wrap ${className}`}>
        <Button
          className="inline-flex gap-2 sm:flex-1"
          disabled={pendiente}
          onClick={() => void preguntarYEnviarWhatsApp()}
        >
          <WhatsAppIcon size={20} className="text-on-primary" />
          {etapa === 'borrador' ? 'Enviar por WhatsApp' : 'Reenviar por WhatsApp'}
        </Button>
        {cliente.correo && (
          <Button
            variant="secondary"
            className="sm:flex-1"
            disabled={pendiente}
            onClick={() => setCorreoModalOpen(true)}
            title={
              smtpActivo
                ? 'Revisar mensaje y enviar vía SMTP'
                : 'Revisar mensaje y abrir tu cliente de correo'
            }
          >
            {labelCorreo}
          </Button>
        )}
      </div>
      <EnviarCotizacionCorreoModal
        open={correoModalOpen}
        onClose={() => setCorreoModalOpen(false)}
        cotizacionId={cotizacionId}
        cliente={cliente}
        preview={preview}
        onSuccess={onSuccess}
      />
    </>
  );
}

/** Envío rápido desde fila (sin diálogo PDF). */
export async function enviarWhatsAppRapido(
  cotizacionId: string,
  cliente: ClienteContacto,
  qc: ReturnType<typeof useQueryClient>,
) {
  const waTab = window.open('about:blank', '_blank');
  try {
    const res = await enviarCotizacion(cotizacionId, {
      canal: 'whatsapp',
      celularDestino: cliente.celular,
      correoDestino: cliente.correo ?? undefined,
    });
    await invalidarTrasEnviarCotizacion(qc, cotizacionId);
    if (res.mensajePrearmado) {
      abrirWhatsApp(waMeUrlCotizacion(cliente.celular, res.mensajePrearmado), waTab);
    } else {
      waTab?.close();
    }
  } catch {
    waTab?.close();
    throw new Error('No se pudo enviar por WhatsApp');
  }
}
