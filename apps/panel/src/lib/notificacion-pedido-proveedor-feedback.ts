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
