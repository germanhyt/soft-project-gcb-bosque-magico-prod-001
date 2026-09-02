import {
  buildContratoPrintHtml,
  contratoToPrintPayload,
  type ContratoPrintPayload,
} from '@bosque/shared';
import { resolveAssetUrl } from './media';
import type { Contrato, ContratoAdjunto, TipoAdjuntoContrato } from './contratos';

export type { ContratoPrintPayload } from '@bosque/shared';
export { contratoToPrintPayload };

function firmaUrl(adjuntos: ContratoAdjunto[] | undefined, tipo: TipoAdjuntoContrato) {
  const adj = adjuntos?.find((a) => a.tipo === tipo);
  return adj?.url ? resolveAssetUrl(adj.url) : undefined;
}

export function opcionesImpresionContrato(
  adjuntos?: ContratoAdjunto[],
): Pick<
  Parameters<typeof buildContratoPrintHtml>[1],
  'firmaClienteUrl' | 'firmaEmpresaUrl'
> {
  return {
    firmaClienteUrl: firmaUrl(adjuntos, 'firma_cliente'),
    firmaEmpresaUrl: firmaUrl(adjuntos, 'firma_empresa'),
  };
}

async function embedImageAsDataUrl(url: string | undefined): Promise<string | undefined> {
  if (!url?.trim()) return undefined;
  if (url.startsWith('data:')) return url;

  try {
    const res = await fetch(url);
    if (!res.ok) return url;
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('read failed'));
      reader.readAsDataURL(blob);
    });
    return dataUrl;
  } catch {
    return url;
  }
}

async function opcionesImpresionContratoEmbedded(adjuntos?: ContratoAdjunto[]) {
  const base = opcionesImpresionContrato(adjuntos);
  const [firmaClienteUrl, firmaEmpresaUrl] = await Promise.all([
    embedImageAsDataUrl(base.firmaClienteUrl),
    embedImageAsDataUrl(base.firmaEmpresaUrl),
  ]);
  return { firmaClienteUrl, firmaEmpresaUrl };
}

function waitForImages(doc: Document, onReady: () => void) {
  const imgs = Array.from(doc.querySelectorAll('img'));
  if (imgs.length === 0) {
    window.setTimeout(onReady, 400);
    return;
  }

  let pending = imgs.filter((img) => !img.complete).length;
  if (pending === 0) {
    window.setTimeout(onReady, 400);
    return;
  }

  const done = () => {
    pending -= 1;
    if (pending <= 0) window.setTimeout(onReady, 400);
  };

  for (const img of imgs) {
    if (img.complete) continue;
    img.onload = done;
    img.onerror = done;
  }
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

  waitForImages(doc, () => {
    win.focus();
    win.print();
    window.setTimeout(() => document.body.removeChild(iframe), 1500);
  });

  return true;
}

export type ImprimirContratoModo = 'ventana' | 'iframe';

export type ImprimirContratoOpts = {
  modo?: ImprimirContratoModo;
  adjuntos?: ContratoAdjunto[];
  esBorrador?: boolean;
};

/** Abre vista imprimible; el usuario guarda como PDF desde el diálogo del navegador. */
export async function imprimirContratoPdf(
  payload: ContratoPrintPayload,
  opts: ImprimirContratoOpts = {},
): Promise<boolean> {
  if (!payload.cotizacion.cliente?.nombreCompleto || !payload.cotizacion.cumpleanero?.nombre) {
    return false;
  }
  if (!payload.form.numeroDocumento.trim()) return false;

  const modo = opts.modo ?? 'ventana';
  const firmas = await opcionesImpresionContratoEmbedded(opts.adjuntos);
  const html = buildContratoPrintHtml(payload, {
    logoUrl: `${window.location.origin}/logo-bm.png`,
    autoPrint: true,
    esBorrador: opts.esBorrador,
    ...firmas,
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

/** Atajo cuando ya tienes el contrato completo con adjuntos. */
export async function imprimirContratoDesdeRegistro(
  contrato: Contrato,
  evento?: Parameters<typeof contratoToPrintPayload>[1],
) {
  return imprimirContratoPdf(contratoToPrintPayload(contrato, evento), {
    adjuntos: contrato.adjuntos,
    esBorrador: contrato.etapa === 'borrador',
  });
}
