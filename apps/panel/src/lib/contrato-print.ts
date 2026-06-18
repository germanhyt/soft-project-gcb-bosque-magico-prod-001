import {
  buildContratoPrintHtml,
  type ContratoPrintPayload,
} from '@bosque/shared';

export type { ContratoPrintPayload } from '@bosque/shared';
export { contratoToPrintPayload } from '@bosque/shared';

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

export type ImprimirContratoModo = 'ventana' | 'iframe';

/** Abre vista imprimible; el usuario guarda como PDF desde el diálogo del navegador. */
export function imprimirContratoPdf(
  payload: ContratoPrintPayload,
  modo: ImprimirContratoModo = 'ventana',
): boolean {
  if (!payload.cotizacion.cliente?.nombreCompleto || !payload.cotizacion.cumpleanero?.nombre) {
    return false;
  }
  if (!payload.form.numeroDocumento.trim()) return false;

  const html = buildContratoPrintHtml(payload, {
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
