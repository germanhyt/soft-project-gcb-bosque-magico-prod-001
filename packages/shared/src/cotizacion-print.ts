import { parseHorarioDesdeNotas } from './horario-servicio';

export type CotizacionPrintEtapa = 'borrador' | 'enviada' | 'aceptada' | 'cerrada';

export type CotizacionPrintItem = {
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  origenItem?: string;
  subtipo?: string | null;
  unidadesPack?: number | null;
  notas?: string | null;
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

const ORDEN_ORIGEN: Record<string, number> = {
  incluido_paquete: 0,
  excedente_paquete: 1,
  adicional: 2,
  manual: 2,
};

function descripcionItem(i: CotizacionPrintItem): string {
  const partes: string[] = [];
  if (i.subtipo === 'piqueo' && i.unidadesPack) {
    partes.push(`${i.cantidad} pack${i.cantidad > 1 ? 's' : ''} · ${i.unidadesPack} uds c/u`);
  }
  const horario = parseHorarioDesdeNotas(i.notas);
  if (horario?.inicio && horario.fin) {
    partes.push(`${horario.inicio}–${horario.fin}`);
  } else if (horario?.inicio) {
    partes.push(`desde ${horario.inicio}`);
  } else if (horario?.fin) {
    partes.push(`hasta ${horario.fin}`);
  }
  return partes.join(' · ');
}

export type FilaPrintCotizacion = {
  clase: 'seccion' | 'paquete' | 'subitem' | 'item';
  nombre: string;
  descripcion: string;
  cantidad: string;
  unitario: string;
  subtotal: string;
};

function filaSeccion(titulo: string): FilaPrintCotizacion {
  return {
    clase: 'seccion',
    nombre: titulo,
    descripcion: '',
    cantidad: '',
    unitario: '',
    subtotal: '',
  };
}

/** Paquete como ítem padre; subítems incluidos; luego excedente y adicionales. */
export function filasTablaCotizacionPrint(cot: CotizacionPrintData): FilaPrintCotizacion[] {
  const items = [...(cot.items ?? [])].sort(
    (a, b) => (ORDEN_ORIGEN[a.origenItem ?? ''] ?? 1) - (ORDEN_ORIGEN[b.origenItem ?? ''] ?? 1),
  );
  const incluidos = items.filter((i) => i.origenItem === 'incluido_paquete');
  const adicionales = items.filter(
    (i) => i.origenItem !== 'incluido_paquete' && i.origenItem !== 'excedente_paquete',
  );
  const excedentes = items.filter((i) => i.origenItem === 'excedente_paquete');

  const toFila = (i: CotizacionPrintItem, clase: 'subitem' | 'item'): FilaPrintCotizacion => {
    const incluido = i.precioUnitario <= 0;
    return {
      clase,
      nombre: i.nombre,
      descripcion: descripcionItem(i),
      cantidad: String(i.cantidad),
      unitario: incluido ? '—' : money(i.precioUnitario),
      subtotal: incluido ? '—' : money(i.subtotal),
    };
  };

  const filas: FilaPrintCotizacion[] = [];
  if (cot.paquete) {
    filas.push({
      clase: 'paquete',
      nombre: `Paquete ${cot.paquete}`,
      descripcion: 'Espacio y servicios incluidos en el paquete',
      cantidad: '1',
      unitario: money(cot.montoBase),
      subtotal: money(cot.montoBase),
    });
    if (incluidos.length) {
      filas.push(filaSeccion('Incluido en el paquete'));
      for (const i of incluidos) filas.push(toFila(i, 'subitem'));
    }
  } else if (incluidos.length) {
    filas.push(filaSeccion('Incluido en el paquete'));
    for (const i of incluidos) filas.push(toFila(i, 'item'));
  }
  if (excedentes.length) {
    filas.push(filaSeccion('Excedentes del paquete'));
    for (const i of excedentes) filas.push(toFila(i, 'item'));
  }
  if (adicionales.length) {
    filas.push(filaSeccion('Adicionales'));
    for (const i of adicionales) filas.push(toFila(i, 'item'));
  }
  return filas;
}

function renderFilasDetalle(cot: CotizacionPrintData): string {
  const filas = filasTablaCotizacionPrint(cot);
  if (!filas.length) return '';
  const body = filas
    .map((f) => {
      if (f.clase === 'seccion') {
        return `<tr class="seccion"><td colspan="5">${escapeHtml(f.nombre)}</td></tr>`;
      }
      return `<tr class="${f.clase}"><td>${escapeHtml(f.nombre)}</td><td>${escapeHtml(f.descripcion)}</td><td>${escapeHtml(f.cantidad)}</td><td>${escapeHtml(f.unitario)}</td><td>${escapeHtml(f.subtotal)}</td></tr>`;
    })
    .join('');
  return `<h2 class="bloque-titulo">Detalle de servicios</h2>
  <table class="detalle">
    <thead><tr><th>Ítem</th><th>Descripción</th><th>Cant.</th><th>P. unit.</th><th>Subtotal</th></tr></thead>
    <tbody>${body}</tbody>
  </table>`;
}

const DEFAULT_FOOTER =
  'Documento generado por Bosque Mágico. Los montos son referenciales según la propuesta vigente.';

/** HTML imprimible unificado (panel + link público). */
export function buildCotizacionPrintHtml(
  cot: CotizacionPrintData,
  options: CotizacionPrintOptions,
): string {
  const cliente = escapeHtml(cot.cliente.nombreCompleto);
  const celular = escapeHtml(cot.cliente.celular ?? '');
  const correo = cot.cliente.correo ? escapeHtml(cot.cliente.correo) : '';
  const cumple = escapeHtml(cot.cumpleanero.nombre);
  const codigo = escapeHtml(cot.codigo);
  const etapa = escapeHtml(ETAPA_LABEL[cot.etapa] ?? cot.etapa);
  const turno = escapeHtml(TURNO_LABEL[cot.turno] ?? cot.turno);
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
    .header img { width: 128px; height: 128px; object-fit: contain; }
    h1 { margin: 0; font-size: 22px; color: #2d5a3d; }
    .meta { color: #5a6b5e; font-size: 13px; margin-top: 4px; }
    .datos { background: #f6faf7; border: 1px solid #d5e3d8; border-radius: 10px; padding: 16px 18px; margin-bottom: 28px; }
    .datos-titulo { margin: 0 0 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #2d5a3d; }
    .banner-borrador { background: #fbf3d5; border: 1px solid #e0c35c; color: #6b5300; padding: 10px 14px; border-radius: 8px; margin: 0 0 20px; font-weight: 700; text-align: center; letter-spacing: 0.04em; text-transform: uppercase; font-size: 12px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; }
    .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #6b7c6f; }
    .value { font-size: 14px; font-weight: 600; margin-top: 2px; }
    .bloque-titulo { margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #2d5a3d; }
    table.detalle { width: 100%; border-collapse: collapse; margin: 0 0 8px; font-size: 13px; }
    table.detalle th, table.detalle td { border: 1px solid #d8e3db; padding: 8px 10px; text-align: left; }
    table.detalle th { background: #2d5a3d; color: #fff; font-size: 11px; letter-spacing: 0.03em; }
    table.detalle tr.seccion td { background: #e8f0ea; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #2d5a3d; }
    table.detalle tr.paquete td { background: #f3f8f4; font-weight: 700; }
    table.detalle tr.subitem td { color: #3d5344; font-size: 12px; }
    table.detalle tr.subitem td:first-child { padding-left: 22px; }
    .resumen { margin: 24px 0 0 auto; width: 280px; font-size: 14px; border: 1px solid #d5e3d8; border-radius: 10px; padding: 12px 16px; background: #f6faf7; }
    .resumen div { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e8efe9; }
    .resumen .grand { font-size: 18px; font-weight: 700; color: #2d5a3d; border-bottom: none; padding-top: 10px; }
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
  ${cot.etapa === 'borrador' ? '<p class="banner-borrador">Borrador — no válida para aceptar</p>' : ''}

  <section class="datos">
    <p class="datos-titulo">Datos del evento</p>
    <div class="grid">
      <div><div class="label">Cliente</div><div class="value">${cliente}</div></div>
      <div><div class="label">Contacto</div><div class="value">${celular}${correo ? ` · ${correo}` : ''}</div></div>
      <div><div class="label">Cumpleañero</div><div class="value">${cumple}${cot.cumpleanero.edad ? ` (${cot.cumpleanero.edad} años)` : ''}</div></div>
      <div><div class="label">Fecha y turno</div><div class="value">${formatFecha(cot.fechaEvento)} · ${turno}</div></div>
      <div><div class="label">Niños</div><div class="value">${cot.cantidadNinos}</div></div>
      ${tematica ? `<div><div class="label">Temática</div><div class="value">${tematica}</div></div>` : ''}
    </div>
  </section>

  ${renderFilasDetalle(cot)}

  <div class="resumen">
    <div><span>Paquete / tarifa base</span><span>${money(cot.montoBase)}</span></div>
    ${cot.montoNinosExtra > 0 ? `<div><span>Niños adicionales</span><span>${money(cot.montoNinosExtra)}</span></div>` : ''}
    ${cot.montoItems > 0 ? `<div><span>Adicionales y excedentes</span><span>${money(cot.montoItems)}</span></div>` : ''}
    <div class="grand"><span>Total</span><span>${money(cot.montoTotal)}</span></div>
  </div>

  ${notas ? `<p><span class="label">Notas</span><br/>${notas}</p>` : ''}

  <p class="footer">${footer}${acceptLink ? `<br/><span class="accept">Aceptar en línea: ${acceptLink}</span>` : ''}</p>
  ${autoPrintScript}
</body>
</html>`;
}
