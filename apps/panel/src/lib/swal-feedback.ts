import Swal from 'sweetalert2';
import { apiErrorMessage } from './api-error';

/** Por encima de DetalleModal (z-60) y Modal anidado (z-80). */
const SWAL_LAYER = {
  customClass: { container: 'swal-over-modal' },
  confirmButtonText: 'Entendido',
} as const;

/** Error de API (400 de validación, 404, SMTP, etc.) en SweetAlert, visible sobre modales. */
export function mostrarErrorApi(err: unknown, titulo: string, fallback?: string) {
  return Swal.fire({
    icon: 'error',
    title: titulo,
    text: apiErrorMessage(err, fallback ?? 'Revisa los requisitos e inténtalo de nuevo.'),
    ...SWAL_LAYER,
  });
}

/** Precondición detectada en el panel, antes de pegarle a la API. */
export function mostrarValidacion(titulo: string, texto: string) {
  return Swal.fire({
    icon: 'info',
    title: titulo,
    text: texto,
    ...SWAL_LAYER,
  });
}
