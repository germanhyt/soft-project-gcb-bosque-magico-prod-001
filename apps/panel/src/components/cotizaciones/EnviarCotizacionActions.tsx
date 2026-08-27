import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Swal from 'sweetalert2';
import { Button } from '../ui/Button';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';
import { invalidarTrasEnviarCotizacion } from '../../lib/enviar-cotizacion-correo';
import { fetchConfiguracionPanel } from '../../lib/configuracion';
import {
  enviarCotizacion,
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
  preview?: { codigo?: string; linkPublico?: string; linkPdfPublico?: string; nombreCliente?: string };
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

  const enviarWhatsApp = async (waTab: Window | null) => {
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

      await Swal.fire({
        icon: 'success',
        title: 'Cotización enviada',
        html: '<p class="text-sm">WhatsApp abierto con links de aceptar y PDF.</p>',
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
    const waTab = window.open('about:blank', '_blank');
    await enviarWhatsApp(waTab);
  };

  if (!puedeEnviar) return null;

  const pendiente = enviandoWa;
  const labelCorreo =
    etapa === 'borrador' ? 'Enviar por correo' : 'Reenviar por correo';

  return (
    <>
      <div className={`col-span-2 grid grid-cols-1 gap-2 sm:grid-cols-2 ${className}`}>
        <Button
          className="inline-flex gap-2"
          disabled={pendiente}
          onClick={() => void preguntarYEnviarWhatsApp()}
        >
          <WhatsAppIcon size={20} className="text-on-primary" />
          {etapa === 'borrador' ? 'Enviar por WhatsApp' : 'Reenviar por WhatsApp'}
        </Button>
        {cliente.correo && (
          <Button
            variant="secondary"
            className="inline-flex gap-2"
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
