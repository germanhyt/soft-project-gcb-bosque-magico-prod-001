import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Swal from 'sweetalert2';
import { Button } from '../ui/Button';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';
import { contratoToPrintPayload } from '../../lib/contrato';
import { imprimirContratoPdf } from '../../lib/contrato-print';
import { marcarContratoEnviado, type Contrato, type EtapaContrato } from '../../lib/contratos';
import { waMeUrlContrato } from '../../lib/whatsapp-contrato';
import { abrirWhatsApp } from '../../lib/whatsapp-cotizacion';

type Props = {
  contrato: Contrato;
  celular: string;
  className?: string;
  onSuccess?: () => void;
};

export function EnviarContratoActions({
  contrato,
  celular,
  className = '',
  onSuccess,
}: Props) {
  const qc = useQueryClient();
  const [enviandoWa, setEnviandoWa] = useState(false);
  const puedeEnviar =
    contrato.etapa === 'borrador' || contrato.etapa === 'enviado';

  const invalidar = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['contrato', contrato.id] }),
      qc.invalidateQueries({ queryKey: ['contratos'] }),
      qc.invalidateQueries({ queryKey: ['contrato-evento', contrato.eventoId] }),
    ]);
  };

  const enviarMut = useMutation({
    mutationFn: () => marcarContratoEnviado(contrato.id),
    onSuccess: async () => {
      await invalidar();
      onSuccess?.();
    },
  });

  const enviarWhatsApp = async (withPdf: boolean, waTab: Window | null) => {
    setEnviandoWa(true);
    try {
      if (contrato.etapa === 'borrador') {
        await marcarContratoEnviado(contrato.id);
        await invalidar();
      }

      const waUrl = waMeUrlContrato(celular, contrato);
      const abierto = abrirWhatsApp(waUrl, waTab);
      if (!abierto) {
        await Swal.fire({
          icon: 'info',
          title: 'Abrir WhatsApp',
          html: `<p class="text-sm mb-3">El navegador bloqueó la ventana emergente.</p><a href="${waUrl}" target="_blank" rel="noopener" class="text-primary underline">Abrir WhatsApp manualmente</a>`,
        });
      }

      if (withPdf) {
        const ok = imprimirContratoPdf(contratoToPrintPayload(contrato), 'iframe');
        if (!ok) {
          await Swal.fire({
            icon: 'warning',
            title: 'PDF no generado',
            text: 'WhatsApp ya se abrió. Puedes imprimir el contrato desde el detalle.',
          });
        }
      }

      await Swal.fire({
        icon: 'success',
        title: contrato.etapa === 'borrador' ? 'Contrato enviado' : 'WhatsApp abierto',
        html: withPdf
          ? '<p class="text-sm">WhatsApp listo. Adjunta el PDF desde el diálogo de impresión.</p>'
          : '<p class="text-sm">WhatsApp abierto con el resumen del contrato.</p>',
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
      title: 'Enviar contrato por WhatsApp',
      html: `<p class="text-sm text-left">Se abrirá WhatsApp con el resumen del contrato. Opcionalmente puedes generar el PDF para adjuntarlo en el chat.</p>`,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'PDF + WhatsApp',
      denyButtonText: 'Solo mensaje',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    });

    if (choice.isDismissed) return;
    const waTab = window.open('about:blank', '_blank');
    await enviarWhatsApp(choice.isConfirmed, waTab);
  };

  if (!puedeEnviar) return null;

  const pendiente = enviandoWa || enviarMut.isPending;
  const etapa = contrato.etapa as EtapaContrato;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <Button
        className="inline-flex w-full gap-2"
        disabled={pendiente}
        onClick={() => void preguntarYEnviarWhatsApp()}
      >
        <WhatsAppIcon size={20} className="text-on-primary" />
        {etapa === 'borrador' ? 'Enviar por WhatsApp' : 'Reenviar por WhatsApp'}
      </Button>
    </div>
  );
}
