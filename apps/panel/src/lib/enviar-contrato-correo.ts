import type { QueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import { api } from './api';
import { linkMailto } from './contacto-links';
import type { Contrato } from './contratos';

export type CorreoContratoPersonalizado = {
  correoDestino: string;
  asunto: string;
  cuerpo: string;
};

export type EnviarContratoCorreoResultado = Contrato & {
  enviadoPorSmtp: boolean;
  correoDestino: string;
  correoAsunto: string;
  correoCuerpo: string;
};

export async function invalidarTrasEnviarContrato(qc: QueryClient, contrato: Contrato) {
  await Promise.all([
    qc.invalidateQueries({ queryKey: ['contrato', contrato.id] }),
    qc.invalidateQueries({ queryKey: ['contratos'] }),
    qc.invalidateQueries({ queryKey: ['contrato-evento', contrato.eventoId] }),
  ]);
}

function abrirClienteCorreo(correo: string, asunto: string, cuerpo?: string) {
  const url = linkMailto(correo, asunto, cuerpo);
  const a = document.createElement('a');
  a.href = url;
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Envía contrato por correo: SMTP si está activo; si no, registra envío y abre mailto.
 */
export async function enviarCorreoContrato(
  contrato: Contrato,
  qc: QueryClient,
  personalizado: CorreoContratoPersonalizado,
): Promise<void> {
  const correo = personalizado.correoDestino.trim();
  if (!correo) {
    throw new Error('Sin correo del cliente');
  }

  const { data } = await api.post<EnviarContratoCorreoResultado>(
    `/bosque-magico/contratos/${contrato.id}/enviar-correo`,
    {
      correoDestino: correo,
      correoAsunto: personalizado.asunto.trim(),
      correoCuerpo: personalizado.cuerpo.trim(),
    },
  );
  await invalidarTrasEnviarContrato(qc, contrato);

  if (data.enviadoPorSmtp) {
    await Swal.fire({
      icon: 'success',
      title: 'Contrato enviado',
      text: 'El correo se envió desde el servidor SMTP.',
      timer: 2200,
      showConfirmButton: false,
    });
    return;
  }

  abrirClienteCorreo(correo, personalizado.asunto.trim(), personalizado.cuerpo.trim());
  await Swal.fire({
    icon: 'info',
    title: 'Cliente de correo',
    html: '<p class="text-sm">SMTP no está activo. Se abrió tu aplicación de correo para revisar y enviar manualmente.</p>',
    timer: 3200,
    showConfirmButton: false,
  });
}
