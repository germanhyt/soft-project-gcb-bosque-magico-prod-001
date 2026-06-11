import type { Contrato } from './contratos';
import { ETAPA_CONTRATO_LABEL } from '../constants/contratos';
import { TURNO_LABEL } from '../constants/solicitudes';
import { waMeUrlCotizacion } from './whatsapp-cotizacion';

function formatFecha(iso: string) {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function mensajeWhatsAppContrato(contrato: Contrato) {
  const snap = contrato.snapshotJson;
  const turno = TURNO_LABEL[snap.evento.turno] ?? snap.evento.turno;
  const fecha = formatFecha(snap.evento.fechaEvento);
  const nombre = snap.cliente.nombreCompleto.split(' ')[0] ?? snap.cliente.nombreCompleto;

  return `Hola ${nombre}, te compartimos el contrato de la fiesta en Bosque Mágico.

Contrato: ${contrato.numero}
Cotización: ${snap.codigoCotizacion}
Fecha del evento: ${fecha} · ${turno}
Total: S/ ${contrato.montoTotal.toFixed(2)}
Adelanto registrado: S/ ${contrato.adelanto1Monto.toFixed(2)}
Saldo pendiente: S/ ${contrato.montoPendiente.toFixed(2)}

Estado: ${ETAPA_CONTRATO_LABEL[contrato.etapa]}
Adjunta o revisa el PDF del contrato con los términos y condiciones.

Bosque Mágico`;
}

export function waMeUrlContrato(celular: string, contrato: Contrato) {
  return waMeUrlCotizacion(celular, mensajeWhatsAppContrato(contrato));
}
