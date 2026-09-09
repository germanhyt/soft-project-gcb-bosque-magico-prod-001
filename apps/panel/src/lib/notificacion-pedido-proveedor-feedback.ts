import Swal from 'sweetalert2';

export type NotificacionProveedorResultado = {
  enviado: boolean;
  motivo?: string;
};

const MOTIVO_TEXTO: Record<string, string> = {
  deshabilitado:
    'La notificación automática está desactivada en Configuración. Usa WhatsApp o el botón de correo.',
  smtp_inactivo:
    'SMTP no configurado. Usa WhatsApp o el botón de correo para contactar al proveedor.',
  sin_correo: 'El proveedor no tiene correo registrado.',
  error_envio: 'No se pudo enviar el correo automático. Intenta el envío manual.',
};

export async function mostrarFeedbackNotificacionProveedor(
  notificacion?: NotificacionProveedorResultado,
) {
  if (!notificacion) return;

  if (notificacion.enviado) {
    await Swal.fire({
      icon: 'success',
      title: 'Correo enviado al proveedor',
      text: 'Se notificó automáticamente al marcar como Solicitado.',
      timer: 2200,
      showConfirmButton: false,
    });
    return;
  }

  const text = notificacion.motivo ? MOTIVO_TEXTO[notificacion.motivo] : '';
  if (!text || notificacion.motivo === 'no_aplica') return;

  await Swal.fire({
    icon: 'info',
    title: 'Sin correo automático',
    text,
    timer: 3600,
    showConfirmButton: false,
  });
}

export async function mostrarResumenNotificacionesProveedor(
  items: NotificacionProveedorResultado[] | undefined,
  opciones: { tituloExito: string; textoExito?: string },
) {
  if (!items?.length) return;

  const enviados = items.filter((i) => i.enviado).length;
  if (enviados > 0) {
    await Swal.fire({
      icon: 'success',
      title: opciones.tituloExito,
      text:
        opciones.textoExito ??
        `Se envió correo a ${enviados} proveedor${enviados === 1 ? '' : 'es'}.`,
      timer: 2600,
      showConfirmButton: false,
    });
    return;
  }

  const motivo = items.find((i) => i.motivo)?.motivo;
  const text = motivo ? MOTIVO_TEXTO[motivo] : '';
  if (!text || motivo === 'no_aplica') return;

  await Swal.fire({
    icon: 'info',
    title: 'Sin correo automático a proveedores',
    text,
    timer: 3600,
    showConfirmButton: false,
  });
}
