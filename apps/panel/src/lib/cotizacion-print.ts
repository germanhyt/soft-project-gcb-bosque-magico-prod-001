import type { Cotizacion } from './cotizaciones';
import { ETAPA_COT_LABEL } from '../constants/cotizaciones';
import { TURNO_LABEL } from '../constants/solicitudes';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatFecha(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function money(n: number) {
  return `S/ ${n.toFixed(2)}`;
}

function buildCotizacionPrintHtml(cot: Cotizacion, logoUrl: string) {
  const items = cot.items ?? [];
  const cliente = escapeHtml(cot.cliente.nombreCompleto);
  const celular = escapeHtml(cot.cliente.celular);
  const correo = cot.cliente.correo ? escapeHtml(cot.cliente.correo) : '';
  const cumple = escapeHtml(cot.cumpleanero.nombre);
  const codigo = escapeHtml(cot.codigo);
  const etapa = escapeHtml(ETAPA_COT_LABEL[cot.etapa] ?? cot.etapa);
  const turno = escapeHtml(TURNO_LABEL[cot.turno] ?? cot.turno);
  const paquete = cot.paquete ? escapeHtml(cot.paquete) : '';
  const tematica = cot.tematica ? escapeHtml(cot.tematica) : '';
  const notas = cot.notas ? escapeHtml(cot.notas).replace(/\n/g, '<br/>') : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Cotización ${codigo}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, Segoe UI, sans-serif; color: #1a2e1f; margin: 0; padding: 32px; }
    .header { display: flex; align-items: center; gap: 16px; border-bottom: 2px solid #2d5a3d; padding-bottom: 16px; margin-bottom: 24px; }
    .header img { width: 72px; height: 72px; object-fit: contain; }
    h1 { margin: 0; font-size: 22px; color: #2d5a3d; }
    .meta { color: #5a6b5e; font-size: 13px; margin-top: 4px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; margin-bottom: 24px; }
    .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #6b7c6f; }
    .value { font-size: 14px; font-weight: 600; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0 24px; font-size: 13px; }
    th, td { border: 1px solid #d8e3db; padding: 8px 10px; text-align: left; }
    th { background: #eef4ef; color: #2d5a3d; font-size: 12px; }
    .totals { margin-left: auto; width: 280px; font-size: 14px; }
    .totals div { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e8efe9; }
    .totals .grand { font-size: 18px; font-weight: 700; color: #2d5a3d; border-bottom: none; padding-top: 10px; }
    .footer { margin-top: 32px; font-size: 12px; color: #6b7c6f; border-top: 1px solid #e8efe9; padding-top: 12px; }
    @media print {
      @page { size: A4 portrait; margin: 15mm; }
      html, body { width: 210mm; min-height: 297mm; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="${logoUrl}" alt="Bosque Mágico" />
    <div>
      <h1>Cotización ${codigo}</h1>
      <p class="meta">Bosque Mágico · ${etapa}</p>
    </div>
  </div>

  <div class="grid">
    <div><div class="label">Cliente</div><div class="value">${cliente}</div></div>
    <div><div class="label">Contacto</div><div class="value">${celular}${correo ? ` · ${correo}` : ''}</div></div>
    <div><div class="label">Cumpleañero</div><div class="value">${cumple}${cot.cumpleanero.edad ? ` (${cot.cumpleanero.edad} años)` : ''}</div></div>
    <div><div class="label">Evento</div><div class="value">${formatFecha(cot.fechaEvento)} · ${turno} · ${cot.cantidadNinos} niños</div></div>
    ${paquete ? `<div><div class="label">Paquete</div><div class="value">${paquete}</div></div>` : ''}
    ${tematica ? `<div><div class="label">Temática</div><div class="value">${tematica}</div></div>` : ''}
  </div>

  ${
    items.length > 0
      ? `<table>
    <thead><tr><th>Ítem</th><th>Cant.</th><th>P. unit.</th><th>Subtotal</th></tr></thead>
    <tbody>
      ${items
        .map(
          (i) =>
            `<tr><td>${escapeHtml(i.nombre)}</td><td>${i.cantidad}</td><td>${money(i.precioUnitario)}</td><td>${money(i.subtotal)}</td></tr>`,
        )
        .join('')}
    </tbody>
  </table>`
      : ''
  }

  <div class="totals">
    <div><span>Tarifa base</span><span>${money(cot.montoBase)}</span></div>
    ${cot.montoNinosExtra > 0 ? `<div><span>Niños adicionales</span><span>${money(cot.montoNinosExtra)}</span></div>` : ''}
    ${cot.montoItems > 0 ? `<div><span>Servicios</span><span>${money(cot.montoItems)}</span></div>` : ''}
    <div class="grand"><span>Total</span><span>${money(cot.montoTotal)}</span></div>
  </div>

  ${notas ? `<p><span class="label">Notas</span><br/>${notas}</p>` : ''}

  <p class="footer">Documento generado desde el panel Bosque Mágico. Los montos son referenciales según la propuesta vigente.</p>
  <script>
    function imprimirCuandoListo() {
      var img = document.querySelector('.header img');
      var lanzar = function () { setTimeout(function () { window.print(); }, 300); };
      if (!img) return lanzar();
      if (img.complete) return lanzar();
      img.onload = lanzar;
      img.onerror = lanzar;
    }
    if (document.readyState === 'complete') imprimirCuandoListo();
    else window.addEventListener('load', imprimirCuandoListo);
  </script>
</body>
</html>`;
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

  const logoUrl = `${window.location.origin}/logo-bm.png`;
  const html = buildCotizacionPrintHtml(cot, logoUrl);

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
