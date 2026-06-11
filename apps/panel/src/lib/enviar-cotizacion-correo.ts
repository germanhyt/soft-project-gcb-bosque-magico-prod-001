import type { QueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import { linkMailto } from './contacto-links';
import { enviarCotizacion } from './cotizaciones';

export type ClienteContactoCorreo = { celular: string; correo?: string | null };

export type CorreoCotizacionPersonalizado = {
  asunto: string;
  cuerpo: string;
};

export async function invalidarTrasEnviarCotizacion(
  qc: QueryClient,
  cotizacionId: string,
) {
  await Promise.all([
    qc.invalidateQueries({ queryKey: ['cotizacion', cotizacionId] }),
    qc.invalidateQueries({ queryKey: ['cotizaciones'] }),
    qc.invalidateQueries({ queryKey: ['solicitudes'] }),
    qc.invalidateQueries({ queryKey: ['solicitudes-resumen'] }),
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
 * Envía cotización por correo: SMTP si está activo; si no, registra envío y abre mailto.
 * Acepta asunto/cuerpo editados desde el modal del panel.
 */
export async function enviarCorreoCotizacion(
  cotizacionId: string,
  cliente: ClienteContactoCorreo,
  qc: QueryClient,
  personalizado?: CorreoCotizacionPersonalizado,
): Promise<void> {
  if (!cliente.correo?.trim()) {
    throw new Error('Sin correo del cliente');
  }

  const res = await enviarCotizacion(cotizacionId, {
    canal: 'email',
    celularDestino: cliente.celular,
    correoDestino: cliente.correo,
    correoAsunto: personalizado?.asunto,
    correoCuerpo: personalizado?.cuerpo,
  });
  await invalidarTrasEnviarCotizacion(qc, cotizacionId);

  const asunto = personalizado?.asunto ?? res.correoAsunto ?? '';
  const cuerpo = personalizado?.cuerpo ?? res.correoCuerpo;

  if (res.enviadoPorSmtp) {
    await Swal.fire({
      icon: 'success',
      title: 'Cotización enviada',
      text: 'El correo se envió desde el servidor SMTP.',
      timer: 2200,
      showConfirmButton: false,
    });
    return;
  }

  if (asunto) {
    abrirClienteCorreo(cliente.correo, asunto, cuerpo);
    await Swal.fire({
      icon: 'info',
      title: 'Cliente de correo',
      html: '<p class="text-sm">Se abrió tu aplicación de correo con el mensaje editado. Revisa y envía manualmente.</p>',
      timer: 3200,
      showConfirmButton: false,
    });
  }
}
