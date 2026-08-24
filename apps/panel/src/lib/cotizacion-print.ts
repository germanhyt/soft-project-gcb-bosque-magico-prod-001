import { buildCotizacionPrintHtml, type CotizacionPrintData } from '@bosque/shared';
import type { Cotizacion } from './cotizaciones';

function toPrintData(cot: Cotizacion): CotizacionPrintData {
  return {
    codigo: cot.codigo,
    etapa: cot.etapa,
    fechaEvento: cot.fechaEvento,
    turno: cot.turno,
    cantidadNinos: cot.cantidadNinos,
    paquete: cot.paquete,
    tematica: cot.tematica,
    notas: cot.notas,
    montoBase: cot.montoBase,
    montoNinosExtra: cot.montoNinosExtra,
    montoItems: cot.montoItems,
    montoTotal: cot.montoTotal,
    cliente: {
      nombreCompleto: cot.cliente.nombreCompleto,
      celular: cot.cliente.celular,
      correo: cot.cliente.correo,
    },
    cumpleanero: cot.cumpleanero,
    items: cot.items?.map((i) => ({
      nombre: i.nombre,
      cantidad: i.cantidad,
      precioUnitario: i.precioUnitario,
      subtotal: i.subtotal,
      origenItem: i.origenItem,
      subtipo: i.subtipo,
      unidadesPack: i.unidadesPack,
    })),
  };
}

function printWithHiddenIframe(html: string): boolean {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText =
    'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = win?.document;
  if (!win || !doc) {
    document.body.removeChild(iframe);
    return false;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const trigger = () => {
    win.focus();
    win.print();
    window.setTimeout(() => document.body.removeChild(iframe), 1500);
  };

  const img = doc.querySelector('img');
  if (img && !img.complete) {
    img.onload = trigger;
    img.onerror = trigger;
  } else {
    window.setTimeout(trigger, 400);
  }

  return true;
}

export type ImprimirCotizacionModo = 'ventana' | 'iframe';

/** Abre vista imprimible; el usuario guarda como PDF desde el diálogo del navegador. */
export function imprimirCotizacionPdf(
  cot: Cotizacion,
  modo: ImprimirCotizacionModo = 'ventana',
): boolean {
  if (!cot.cliente?.nombreCompleto || !cot.cumpleanero?.nombre) return false;

  const html = buildCotizacionPrintHtml(toPrintData(cot), {
    logoUrl: `${window.location.origin}/logo-bm.png`,
    autoPrint: true,
  });

  if (modo === 'iframe') {
    return printWithHiddenIframe(html);
  }

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);

  const win = window.open(blobUrl, '_blank');
  if (win) {
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return true;
  }

  URL.revokeObjectURL(blobUrl);
  return printWithHiddenIframe(html);
}
