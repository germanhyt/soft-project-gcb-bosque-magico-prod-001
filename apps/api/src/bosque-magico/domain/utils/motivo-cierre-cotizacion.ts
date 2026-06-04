import { MotivoCierreCotizacion, MotivoCierreSolicitud } from '@prisma/client';

export function motivoCierreCotizacionDesdeSolicitud(
  motivo: MotivoCierreSolicitud,
): MotivoCierreCotizacion {
  switch (motivo) {
    case MotivoCierreSolicitud.perdida:
      return MotivoCierreCotizacion.rechazada;
    case MotivoCierreSolicitud.duplicada:
      return MotivoCierreCotizacion.reemplazada;
    case MotivoCierreSolicitud.sin_respuesta:
      return MotivoCierreCotizacion.vencida;
    default:
      return MotivoCierreCotizacion.otro;
  }
}
