import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Swal from 'sweetalert2';
import { Button } from '../ui/Button';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';
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

  const enviarWhatsApp = async () => {
    setEnviandoWa(true);
    const waTab = window.open('about:blank', '_blank');
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

      await Swal.fire({
        icon: 'success',
        title: contrato.etapa === 'borrador' ? 'Contrato enviado' : 'WhatsApp abierto',
        html: '<p class="text-sm">WhatsApp abierto con links de resumen y PDF del contrato.</p>',
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

  if (!puedeEnviar) return null;

  const pendiente = enviandoWa || enviarMut.isPending;
  const etapa = contrato.etapa as EtapaContrato;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <Button
        className="inline-flex w-full gap-2"
        disabled={pendiente}
        onClick={() => void enviarWhatsApp()}
      >
        <WhatsAppIcon size={20} className="text-on-primary" />
        {etapa === 'borrador' ? 'Enviar por WhatsApp' : 'Reenviar por WhatsApp'}
      </Button>
    </div>
  );
}
