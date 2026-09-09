import type { Contrato } from './contratos';
import { linkPdfPublicoContratoCompleto, linkPublicoContratoCompleto } from './contratos';
import { ETAPA_CONTRATO_LABEL } from '../constants/contratos';
import { etiquetaTurno, formatFechaCalendarioLarga } from '@bosque/shared';
import { waMeUrlCotizacion } from './whatsapp-cotizacion';

export function mensajeWhatsAppContrato(contrato: Contrato) {
  const snap = contrato.snapshotJson;
  const turno = etiquetaTurno(
    snap.evento.turno,
    snap.evento.horarioInicio,
    snap.evento.horarioFin,
  );
  const fecha = formatFechaCalendarioLarga(snap.evento.fechaEvento);
  const nombre = snap.cliente.nombreCompleto.split(' ')[0] ?? snap.cliente.nombreCompleto;
  const link = linkPublicoContratoCompleto(contrato.linkPublico || contrato.tokenPublico);
  const linkPdf = linkPdfPublicoContratoCompleto(contrato.linkPdfPublico || contrato.tokenPublico);

  const intro =
    contrato.etapa === 'firmado'
      ? `Hola ${nombre}, te compartimos el contrato firmado de la fiesta en Bosque Mágico.`
      : `Hola ${nombre}, te compartimos el contrato de la fiesta en Bosque Mágico.`;

  return `${intro}

Contrato: ${contrato.numero}
Cotización: ${snap.codigoCotizacion}
Fecha del evento: ${fecha} · ${turno}
Total: S/ ${contrato.montoTotal.toFixed(2)}
Adelanto registrado: S/ ${contrato.adelanto1Monto.toFixed(2)}
Saldo pendiente: S/ ${contrato.montoPendiente.toFixed(2)}

Ver resumen en línea:
${link}

Descargar PDF:
${linkPdf}

Estado: ${ETAPA_CONTRATO_LABEL[contrato.etapa]}

Bosque Mágico`;
}

export function waMeUrlContrato(celular: string, contrato: Contrato) {
  return waMeUrlCotizacion(celular, mensajeWhatsAppContrato(contrato));
}
