import {
  CONTRATO_ESPACIO_INCLUYE,
  CONTRATO_EXTRAS_PERMITIDOS,
  CONTRATO_TERMINOS_CLAUSULAS,
  CONTRATO_TERMINOS_VERSION,
} from '../constants/contrato-terminos';
import { TURNO_LABEL } from '../constants/solicitudes';
import {
  agruparItemsPorTipo,
  itemsCajitas,
  itemsCateringTematico,
  itemsExtras,
  itemsSnacks,
  nombreEnContrato,
  normTexto,
  paqueteTipo,
} from './contrato-print-items';
import {
  buildContratoContext,
  type ContratoPrintPayload,
} from './contrato';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatFecha(iso: string) {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatFechaLarga(iso: string) {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
}

function money(n: number) {
  return `S/ ${n.toFixed(2)}`;
}

function cb(checked: boolean) {
  return `<span class="cb${checked ? ' on' : ''}">${checked ? '✓' : ''}</span>`;
}

function filaItem(nombre: string, cantidad: number, subtotal: number) {
  return `<tr>
    <td>${escapeHtml(nombreEnContrato(nombre))}</td>
    <td class="num">${cantidad}</td>
    <td class="num">${money(subtotal)}</td>
  </tr>`;
}

function buildServiciosContratadosHtml(ctx: ReturnType<typeof buildContratoContext>) {
  const { items, montoBase, montoNinosExtra, cantidadNinos } = ctx;
  const filas: string[] = [];

  filas.push(
    `<tr class="base">
      <td>Reserva espacio privado (3 horas) · ${cantidadNinos} niños</td>
      <td class="num">1</td>
      <td class="num">${money(montoBase)}</td>
    </tr>`,
  );

  if (montoNinosExtra > 0) {
    filas.push(
      `<tr>
        <td>Niños adicionales (sobre cupo base)</td>
        <td class="num">—</td>
        <td class="num">${money(montoNinosExtra)}</td>
      </tr>`,
    );
  }

  for (const grupo of agruparItemsPorTipo(items)) {
    for (const item of grupo.items) {
      filas.push(filaItem(item.nombre, item.cantidad, item.subtotal));
    }
  }

  return `
    <h2>Servicios contratados</h2>
    <table class="items">
      <thead><tr><th>Concepto</th><th>Cant.</th><th>Subtotal</th></tr></thead>
      <tbody>${filas.join('')}</tbody>
    </table>
    <div class="totals">
      <div><span>Tarifa base (espacio)</span><span>${money(montoBase)}</span></div>
      ${montoNinosExtra > 0 ? `<div><span>Niños adicionales</span><span>${money(montoNinosExtra)}</span></div>` : ''}
      ${ctx.montoItems > 0 ? `<div><span>Shows, catering y extras</span><span>${money(ctx.montoItems)}</span></div>` : ''}
      <div class="grand"><span>Total contratado</span><span>${money(ctx.montoTotal)}</span></div>
    </div>`;
}

function buildCateringYCajitasHtml(items: ReturnType<typeof buildContratoContext>['items']) {
  const cajitas = itemsCajitas(items);
  const tematico = itemsCateringTematico(items);
  const snacks = itemsSnacks(items);
  const parts: string[] = [];

  if (cajitas.length > 0) {
    const totalQty = cajitas.reduce((s, i) => s + i.cantidad, 0);
    const filas = cajitas
      .map((i) => {
        const n = normTexto(i.nombre);
        const clasica = n.includes('clasica');
        const saludable = n.includes('saludable');
        const tipo =
          clasica || saludable
            ? ` · ${clasica ? 'Clásica' : ''}${saludable ? 'Saludable' : ''}`
            : '';
        return `<li>${i.cantidad} u. — ${escapeHtml(nombreEnContrato(i.nombre))}${escapeHtml(tipo)} (${money(i.subtotal)})</li>`;
      })
      .join('');
    parts.push(
      `<p class="checks">${cb(true)} <strong>${totalQty}</strong> unidades cajita Bosque Mágico</p><ul class="compact">${filas}</ul>`,
    );
  }

  if (tematico.length > 0) {
    parts.push(
      `<h3 class="sub">Catering temático</h3><ul class="compact">${tematico
        .map(
          (i) =>
            `<li>${escapeHtml(nombreEnContrato(i.nombre))} × ${i.cantidad} — ${money(i.subtotal)}</li>`,
        )
        .join('')}</ul>`,
    );
  }

  if (snacks.length > 0) {
    parts.push(
      `<h3 class="sub">Carrito / snacks</h3><ul class="compact">${snacks
        .map(
          (i) =>
            `<li>${escapeHtml(nombreEnContrato(i.nombre))} × ${i.cantidad} — ${money(i.precioUnitario)} c/u · ${money(i.subtotal)}</li>`,
        )
        .join('')}</ul>`,
    );
  }

  if (parts.length === 0) return '';
  return `<h2>Catering contratado</h2>${parts.join('')}`;
}

function buildExtrasContratadosHtml(items: ReturnType<typeof buildContratoContext>['items']) {
  const shows = items.filter((i) => i.tipo === 'show');
  const extras = itemsExtras(items);
  const parts: string[] = [];

  if (shows.length > 0) {
    parts.push(
      `<h3 class="sub">Shows</h3><ul class="compact">${shows
        .map(
          (i) =>
            `<li>${escapeHtml(nombreEnContrato(i.nombre))} × ${i.cantidad} — ${money(i.subtotal)}</li>`,
        )
        .join('')}</ul>`,
    );
  }

  if (extras.length > 0) {
    parts.push(
      `<h3 class="sub">Servicios adicionales</h3><ul class="compact">${extras
        .map(
          (i) =>
            `<li>${escapeHtml(nombreEnContrato(i.nombre))} × ${i.cantidad} — ${money(i.subtotal)}</li>`,
        )
        .join('')}</ul>`,
    );
  }

  if (parts.length === 0) {
    return '<p class="muted">Sin shows ni extras adicionales fuera del espacio base.</p>';
  }

  return `<h2>Detalle shows y extras</h2>${parts.join('')}`;
}

function buildContratoPrintHtml(payload: ContratoPrintPayload, logoUrl: string) {
  const ctx = buildContratoContext(payload);
  const { form, items } = ctx;
  const pkg = paqueteTipo(ctx.paquete);
  const turnoLabel = escapeHtml(TURNO_LABEL[ctx.turno] ?? ctx.turno);
  const horario = `${escapeHtml(form.horarioInicio)} — ${escapeHtml(form.horarioFin)}`;

  const clausulas = CONTRATO_TERMINOS_CLAUSULAS.map(
    (c, i) => `<li><strong>${i + 1}.-</strong> ${escapeHtml(c)}</li>`,
  ).join('');

  const extrasPermitidos = CONTRATO_EXTRAS_PERMITIDOS.map((e) => `<li>${escapeHtml(e)}</li>`).join('');
  const espacioIncluye = CONTRATO_ESPACIO_INCLUYE.map((e) => `<li>${escapeHtml(e)}</li>`).join('');

  const serviciosHtml = buildServiciosContratadosHtml(ctx);
  const cateringHtml = buildCateringYCajitasHtml(items);
  const extrasHtml = buildExtrasContratadosHtml(items);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Contrato — ${escapeHtml(ctx.codigoCotizacion)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, Segoe UI, sans-serif; color: #1a2e1f; margin: 0; padding: 24px 32px; font-size: 12px; line-height: 1.45; }
    .page { page-break-after: always; }
    .page:last-child { page-break-after: auto; }
    .header { text-align: center; border-bottom: 2px solid #2d5a3d; padding-bottom: 12px; margin-bottom: 16px; }
    .header img { width: 56px; height: 56px; object-fit: contain; }
    h1 { margin: 8px 0 0; font-size: 18px; color: #2d5a3d; letter-spacing: 0.02em; }
    h2 { font-size: 13px; color: #2d5a3d; margin: 16px 0 8px; text-transform: uppercase; letter-spacing: 0.04em; }
    h3.sub { font-size: 12px; color: #2d5a3d; margin: 12px 0 6px; font-weight: 700; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; margin-bottom: 12px; }
    .field .lbl { font-size: 10px; color: #6b7c6f; text-transform: uppercase; }
    .field .val { font-weight: 600; min-height: 18px; border-bottom: 1px dotted #c5d4c9; }
    .cb { display: inline-flex; width: 14px; height: 14px; border: 1px solid #2d5a3d; margin-right: 4px; align-items: center; justify-content: center; font-size: 10px; vertical-align: middle; }
    .cb.on { background: #2d5a3d; color: #fff; }
    .checks { margin: 8px 0; }
    ul.compact { margin: 6px 0; padding-left: 18px; }
    ul.compact li { margin-bottom: 3px; }
    table.items { width: 100%; border-collapse: collapse; margin: 8px 0 12px; font-size: 11px; }
    table.items th, table.items td { border: 1px solid #d8e3db; padding: 5px 8px; text-align: left; }
    table.items th { background: #eef4ef; color: #2d5a3d; }
    table.items td.num { text-align: right; white-space: nowrap; }
    table.items tr.base td { background: #f8fbf9; }
    .totals { margin: 12px 0 16px; margin-left: auto; width: 300px; font-size: 12px; }
    .totals div { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e8efe9; }
    .totals .grand { font-size: 15px; font-weight: 700; color: #2d5a3d; border-bottom: none; padding-top: 8px; }
    .terms ol { padding-left: 18px; }
    .terms li { margin-bottom: 8px; }
    .factura { margin-top: 20px; }
    .factura .row { display: flex; justify-content: space-between; border-bottom: 1px dotted #c5d4c9; padding: 6px 0; }
    .factura .total { font-size: 15px; font-weight: 700; color: #2d5a3d; }
    .firma { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
    .firma-line { border-top: 1px solid #2d5a3d; padding-top: 6px; text-align: center; }
    .meta, .muted { font-size: 10px; color: #6b7c6f; margin-top: 8px; }
    @media print { body { padding: 12px 16px; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <img src="${logoUrl}" alt="Bosque Mágico" />
      <h1>CONTRATO FIESTAS INFANTILES</h1>
    </div>

    <h2>Datos del cliente</h2>
    <div class="grid">
      <div class="field"><div class="lbl">Nombres y apellidos</div><div class="val">${escapeHtml(ctx.cliente.nombreCompleto)}</div></div>
      <div class="field"><div class="lbl">N° de celular</div><div class="val">${escapeHtml(ctx.cliente.celular)}</div></div>
      <div class="field"><div class="lbl">Correo electrónico</div><div class="val">${ctx.cliente.correo ? escapeHtml(ctx.cliente.correo) : '—'}</div></div>
      <div class="field"><div class="lbl">N° de DNI</div><div class="val">${escapeHtml(ctx.cliente.numeroDocumento ?? '')}</div></div>
    </div>

    <h2>Datos del cumpleañero</h2>
    <div class="grid">
      <div class="field"><div class="lbl">Nombre</div><div class="val">${escapeHtml(ctx.cumpleanero.nombre)}</div></div>
      <div class="field"><div class="lbl">Edad</div><div class="val">${ctx.cumpleanero.edad ?? '—'}</div></div>
      <div class="field"><div class="lbl">Fecha de evento</div><div class="val">${formatFecha(ctx.fechaEvento)}</div></div>
    </div>

    <h2>Datos del evento</h2>
    <div class="grid">
      <div class="field"><div class="lbl">Horario</div><div class="val">${horario}</div></div>
      <div class="field"><div class="lbl">Turno</div><div class="val">${turnoLabel}</div></div>
      <div class="field"><div class="lbl">Zona</div><div class="val">${escapeHtml(ctx.zona)}</div></div>
      <div class="field"><div class="lbl">N° de invitados (niños)</div><div class="val">${ctx.cantidadNinos}</div></div>
      <div class="field"><div class="lbl">Temática</div><div class="val">${ctx.tematica ? escapeHtml(ctx.tematica) : '—'}</div></div>
      <div class="field"><div class="lbl">Paquete</div><div class="val">${ctx.paquete ? escapeHtml(ctx.paquete) : '—'}</div></div>
    </div>

    <p class="checks">
      Paquete contratado:
      ${cb(pkg === 'basico')} Básico
      ${cb(pkg === 'estandar')} Estándar
      ${cb(pkg === 'premium')} Premium
    </p>

    ${serviciosHtml}

    <h2>Espacio privado por 3 horas — incluye</h2>
    <p class="muted">Mobiliario y servicios estándar del espacio (según paquete Bosque Mágico).</p>
    <ul class="compact">${espacioIncluye}</ul>
  </div>

  <div class="page">
    ${cateringHtml}
    ${extrasHtml}

    <h2>Extras permitidos (referencia)</h2>
    <p class="muted">Servicios no incluidos en la cotización; sujeto a tarifa vigente y disponibilidad.</p>
    <ul class="compact">${extrasPermitidos}</ul>

    <h2>Términos y condiciones</h2>
    <div class="terms"><ol>${clausulas}</ol></div>
    <p class="meta">Versión ${CONTRATO_TERMINOS_VERSION} · Horario acordado: ${horario}</p>
  </div>

  <div class="page">
    <h2>Facturación</h2>
    <div class="grid">
      <div class="field">
        <div class="lbl">Comprobante</div>
        <div class="val">${form.tipoComprobante === 'factura' ? 'Factura' : 'Boleta'}</div>
      </div>
      <div class="field">
        <div class="lbl">DNI / RUC</div>
        <div class="val">${escapeHtml(form.documentoTributario || form.numeroDocumento)}</div>
      </div>
    </div>

    <div class="factura">
      <div class="row"><span>Adelanto 1</span><span>${money(form.adelanto1Monto)}${form.adelanto1Fecha ? ` · ${formatFecha(form.adelanto1Fecha)}` : ''}</span></div>
      ${
        form.adelanto2Monto > 0
          ? `<div class="row"><span>Adelanto 2</span><span>${money(form.adelanto2Monto)}${form.adelanto2Fecha ? ` · ${formatFecha(form.adelanto2Fecha)}` : ''}</span></div>`
          : ''
      }
      <div class="row"><span>Monto pendiente</span><span>${money(Math.max(ctx.montoTotal - form.adelanto1Monto - (form.adelanto2Monto || 0), 0))}</span></div>
      <div class="row total"><span>Monto total contratado</span><span>${money(ctx.montoTotal)}</span></div>
      <div class="row"><span>Garantía referencial</span><span>${money(form.montoGarantia)}</span></div>
    </div>

    <div class="firma">
      <div><div class="firma-line">Firma del cliente</div></div>
      <div><div class="firma-line">Bosque Mágico</div></div>
    </div>
    <div class="grid" style="margin-top:24px">
      <div class="field"><div class="lbl">Nombre</div><div class="val">${escapeHtml(ctx.cliente.nombreCompleto)}</div></div>
      <div class="field"><div class="lbl">DNI</div><div class="val">${escapeHtml(form.numeroDocumento)}</div></div>
    </div>

    <p class="meta">
      Contrato generado el ${formatFechaLarga(ctx.fechaEmision)} · Cotización ${escapeHtml(ctx.codigoCotizacion)} · Panel Bosque Mágico
    </p>
  </div>

  <script>
    function imprimirCuandoListo() {
      var img = document.querySelector('img');
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

export type ImprimirContratoModo = 'ventana' | 'iframe';

export function imprimirContratoPdf(
  payload: ContratoPrintPayload,
  modo: ImprimirContratoModo = 'ventana',
): boolean {
  if (!payload.cotizacion.cliente?.nombreCompleto || !payload.cotizacion.cumpleanero?.nombre) {
    return false;
  }
  if (!payload.form.numeroDocumento.trim()) return false;

  const logoUrl = `${window.location.origin}/logo-bm.png`;
  const html = buildContratoPrintHtml(payload, logoUrl);

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
