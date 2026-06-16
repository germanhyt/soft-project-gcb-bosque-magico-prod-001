export type CotizacionPrintEtapa = 'borrador' | 'enviada' | 'aceptada' | 'cerrada';

export type CotizacionPrintItem = {
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
};

export type CotizacionPrintData = {
  codigo: string;
  etapa: CotizacionPrintEtapa;
  fechaEvento: string;
  turno: string;
  cantidadNinos: number;
  paquete?: string | null;
  tematica?: string | null;
  notas?: string | null;
  montoBase: number;
  montoNinosExtra: number;
  montoItems: number;
  montoTotal: number;
  cliente: { nombreCompleto: string; celular: string; correo?: string | null };
  cumpleanero: { nombre: string; edad?: number | null };
  items?: CotizacionPrintItem[];
};

export type CotizacionPrintOptions = {
  logoUrl: string;
  /** Pie de página; por defecto texto estándar Bosque Mágico */
  footerNote?: string;
  /** Si true, abre diálogo de impresión al cargar (panel interno) */
  autoPrint?: boolean;
  /** Enlace opcional para aceptar en línea (vista pública) */
  acceptLink?: string;
};

const ETAPA_LABEL: Record<CotizacionPrintEtapa, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  aceptada: 'Aceptada',
  cerrada: 'Cerrada',
};

const TURNO_LABEL: Record<string, string> = {
  turno_1: 'Turno 1',
  turno_2: 'Turno 2',
  turno_3: 'Turno 3',
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatFecha(iso: string) {
  const d = new Date(iso.includes('T') ? iso : `${iso.slice(0, 10)}T12:00:00`);
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

const DEFAULT_FOOTER =
  'Documento generado por Bosque Mágico. Los montos son referenciales según la propuesta vigente.';

/** HTML imprimible unificado (panel + link público). */
export function buildCotizacionPrintHtml(
  cot: CotizacionPrintData,
  options: CotizacionPrintOptions,
): string {
  const items = cot.items ?? [];
  const cliente = escapeHtml(cot.cliente.nombreCompleto);
  const celular = escapeHtml(cot.cliente.celular ?? '');
  const correo = cot.cliente.correo ? escapeHtml(cot.cliente.correo) : '';
  const cumple = escapeHtml(cot.cumpleanero.nombre);
  const codigo = escapeHtml(cot.codigo);
  const etapa = escapeHtml(ETAPA_LABEL[cot.etapa] ?? cot.etapa);
  const turno = escapeHtml(TURNO_LABEL[cot.turno] ?? cot.turno);
  const paquete = cot.paquete ? escapeHtml(cot.paquete) : '';
  const tematica = cot.tematica ? escapeHtml(cot.tematica) : '';
  const notas = cot.notas ? escapeHtml(cot.notas).replace(/\n/g, '<br/>') : '';
  const footer = escapeHtml(options.footerNote ?? DEFAULT_FOOTER);
  const acceptLink = options.acceptLink ? escapeHtml(options.acceptLink) : '';

  const autoPrintScript = options.autoPrint
    ? `<script>
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
  </script>`
    : '';

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
    .accept { margin-top: 8px; font-size: 12px; word-break: break-all; }
    @media print {
      @page { size: A4 portrait; margin: 15mm; }
      html, body { width: 210mm; min-height: 297mm; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="${escapeHtml(options.logoUrl)}" alt="Bosque Mágico" />
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

  <p class="footer">${footer}${acceptLink ? `<br/><span class="accept">Aceptar en línea: ${acceptLink}</span>` : ''}</p>
  ${autoPrintScript}
</body>
</html>`;
}
