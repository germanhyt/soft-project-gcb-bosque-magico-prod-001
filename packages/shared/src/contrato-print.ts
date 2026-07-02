import {
  CONTRATO_ESPACIO_INCLUYE,
  CONTRATO_EXTRAS_PERMITIDOS,
  CONTRATO_TERMINOS_CLAUSULAS,
  CONTRATO_TERMINOS_VERSION,
} from './contrato-terminos';
import {
  agruparItemsPorTipo,
  itemsCajitas,
  itemsCateringTematico,
  itemsExtras,
  itemsSnacks,
  nombreEnContrato,
  normTexto,
  paqueteTipo,
  type ContratoPrintItem,
} from './contrato-print-items';

export type TipoComprobante = 'boleta' | 'factura';

export type ContratoFormDatos = {
  numeroDocumento: string;
  tipoComprobante: TipoComprobante;
  documentoTributario: string;
  horarioInicio: string;
  horarioFin: string;
  adelanto1Monto: number;
  adelanto1Fecha: string;
  adelanto2Monto: number;
  adelanto2Fecha: string;
  montoGarantia: number;
};

export type ContratoPrintCotizacion = {
  codigo: string;
  fechaEvento: string;
  turno: string;
  cantidadNinos: number;
  tematica?: string | null;
  paquete?: string | null;
  montoBase: number;
  montoNinosExtra: number;
  montoItems: number;
  montoTotal: number;
  cliente: {
    nombreCompleto: string;
    celular: string;
    correo?: string | null;
    numeroDocumento?: string | null;
  };
  cumpleanero: { nombre: string; edad?: number | null };
  items?: ContratoPrintItem[];
};

export type ContratoPrintEvento = {
  fechaEvento?: string;
  turno?: string;
  zona?: string;
  cantidadNinos?: number;
  tematica?: string | null;
  montoTotal?: number;
};

export type ContratoPrintPayload = {
  cotizacion: ContratoPrintCotizacion;
  evento?: ContratoPrintEvento | null;
  form: ContratoFormDatos;
  fechaEmision: string;
};

export type ContratoSnapshotJson = {
  codigoCotizacion: string;
  evento: {
    id: string;
    fechaEvento: string;
    turno: string;
    zona: string;
    cantidadNinos: number;
    tematica: string | null;
    montoTotal: number;
  };
  cliente: {
    nombreCompleto: string;
    celular: string;
    correo: string | null;
    numeroDocumento: string | null;
    tipoDocumento: string | null;
  };
  cumpleanero: { nombre: string; edad: number | null };
  cotizacion: {
    id: string;
    codigo: string;
    paquete: string | null;
    tematica: string | null;
    montoBase: number;
    montoNinosExtra: number;
    montoItems: number;
    montoTotal: number;
    items: ContratoPrintItem[];
  };
};

export type ContratoPrintOptions = {
  logoUrl: string;
  /** Si true, abre diálogo de impresión al cargar (panel interno) */
  autoPrint?: boolean;
  /** Enlace opcional a vista pública del contrato */
  viewLink?: string;
  firmaClienteUrl?: string;
  firmaEmpresaUrl?: string;
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

export function buildContratoContext(payload: ContratoPrintPayload) {
  const { cotizacion: cot, evento, form } = payload;

  return {
    codigoCotizacion: cot.codigo,
    fechaEvento: evento?.fechaEvento ?? cot.fechaEvento,
    turno: evento?.turno ?? cot.turno,
    zona: evento?.zona ?? 'Bosque Mágico',
    cantidadNinos: evento?.cantidadNinos ?? cot.cantidadNinos,
    tematica: evento?.tematica ?? cot.tematica ?? null,
    paquete: cot.paquete ?? null,
    montoBase: cot.montoBase,
    montoNinosExtra: cot.montoNinosExtra,
    montoItems: cot.montoItems,
    montoTotal: evento?.montoTotal ?? cot.montoTotal,
    cliente: {
      nombreCompleto: cot.cliente.nombreCompleto,
      celular: cot.cliente.celular,
      correo: cot.cliente.correo,
      numeroDocumento: form.numeroDocumento.trim(),
    },
    cumpleanero: cot.cumpleanero,
    items: (cot.items ?? []) as ContratoPrintItem[],
    form,
    fechaEmision: payload.fechaEmision,
  };
}

/** Convierte contrato persistido en payload para imprimir (usa snapshot congelado). */
export function contratoToPrintPayload(
  contrato: {
    fechaEmision: string;
    numeroDocumento: string;
    tipoComprobante: TipoComprobante;
    documentoTributario: string;
    horarioInicio: string;
    horarioFin: string;
    adelanto1Monto: number;
    adelanto1Fecha: string | null;
    adelanto2Monto: number | null;
    adelanto2Fecha: string | null;
    montoGarantia: number;
    snapshotJson: ContratoSnapshotJson;
  },
  evento?: ContratoPrintEvento | null,
): ContratoPrintPayload {
  const snap = contrato.snapshotJson;

  return {
    cotizacion: {
      codigo: snap.codigoCotizacion,
      fechaEvento: snap.evento.fechaEvento,
      turno: snap.evento.turno,
      cantidadNinos: snap.evento.cantidadNinos,
      tematica: snap.cotizacion.tematica,
      paquete: snap.cotizacion.paquete,
      montoBase: snap.cotizacion.montoBase,
      montoNinosExtra: snap.cotizacion.montoNinosExtra,
      montoItems: snap.cotizacion.montoItems,
      montoTotal: snap.cotizacion.montoTotal,
      cliente: {
        nombreCompleto: snap.cliente.nombreCompleto,
        celular: snap.cliente.celular,
        correo: snap.cliente.correo,
        numeroDocumento: snap.cliente.numeroDocumento,
      },
      cumpleanero: {
        nombre: snap.cumpleanero.nombre,
        edad: snap.cumpleanero.edad,
      },
      items: snap.cotizacion.items,
    },
    evento: evento ?? {
      fechaEvento: snap.evento.fechaEvento,
      turno: snap.evento.turno,
      zona: snap.evento.zona,
      tematica: snap.evento.tematica,
      cantidadNinos: snap.evento.cantidadNinos,
      montoTotal: snap.evento.montoTotal,
    },
    form: {
      numeroDocumento: contrato.numeroDocumento,
      tipoComprobante: contrato.tipoComprobante,
      documentoTributario: contrato.documentoTributario,
      horarioInicio: contrato.horarioInicio,
      horarioFin: contrato.horarioFin,
      adelanto1Monto: contrato.adelanto1Monto,
      adelanto1Fecha: contrato.adelanto1Fecha ?? '',
      adelanto2Monto: contrato.adelanto2Monto ?? 0,
      adelanto2Fecha: contrato.adelanto2Fecha ?? '',
      montoGarantia: contrato.montoGarantia,
    },
    fechaEmision: contrato.fechaEmision,
  };
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

function buildFirmaCell(label: string, imageUrl?: string) {
  const img = imageUrl?.trim()
    ? `<img class="firma-img" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(label)}" />`
    : '';
  return `<div class="firma-cell">
    <div class="firma-pad">${img}<div class="firma-line"></div></div>
    <p class="firma-caption">${escapeHtml(label)}</p>
  </div>`;
}

/** HTML imprimible unificado (panel + link público). */
export function buildContratoPrintHtml(
  payload: ContratoPrintPayload,
  options: ContratoPrintOptions,
): string {
  const ctx = buildContratoContext(payload);
  const { form, items } = ctx;
  const pkg = paqueteTipo(ctx.paquete);
  const turnoLabel = escapeHtml(TURNO_LABEL[ctx.turno] ?? ctx.turno);
  const horario = `${escapeHtml(form.horarioInicio)} — ${escapeHtml(form.horarioFin)}`;

  const clausulas = CONTRATO_TERMINOS_CLAUSULAS.map(
    (c) => `<li>${escapeHtml(c)}</li>`,
  ).join('');

  const extrasPermitidos = CONTRATO_EXTRAS_PERMITIDOS.map((e) => `<li>${escapeHtml(e)}</li>`).join('');
  const espacioIncluye = CONTRATO_ESPACIO_INCLUYE.map((e) => `<li>${escapeHtml(e)}</li>`).join('');

  const serviciosHtml = buildServiciosContratadosHtml(ctx);
  const cateringHtml = buildCateringYCajitasHtml(items);
  const extrasHtml = buildExtrasContratadosHtml(items);

  const viewLink = options.viewLink ? escapeHtml(options.viewLink) : '';

  const autoPrintScript = options.autoPrint
    ? `<script>
    function imprimirCuandoListo() {
      var lanzar = function () { setTimeout(function () { window.print(); }, 400); };
      var imgs = document.querySelectorAll('img');
      if (!imgs.length) return lanzar();
      var pendientes = 0;
      for (var i = 0; i < imgs.length; i++) {
        if (!imgs[i].complete) pendientes++;
      }
      if (!pendientes) return lanzar();
      var restantes = pendientes;
      for (var j = 0; j < imgs.length; j++) {
        (function (img) {
          if (img.complete) return;
          img.onload = img.onerror = function () {
            restantes--;
            if (restantes <= 0) lanzar();
          };
        })(imgs[j]);
      }
    }
    if (document.readyState === 'complete') imprimirCuandoListo();
    else window.addEventListener('load', imprimirCuandoListo);
  </script>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Contrato — ${escapeHtml(ctx.codigoCotizacion)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, Segoe UI, sans-serif; color: #1a2e1f; margin: 0; padding: 24px 32px; font-size: 12px; line-height: 1.45; }
    .sheet { }
    .sheet-break { page-break-before: always; }
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
    .terms ol { padding-left: 22px; margin: 8px 0 0; list-style: decimal; }
    .terms li { margin-bottom: 8px; }
    .terms li::marker { font-weight: 700; color: #2d5a3d; }
    .factura { margin-top: 20px; }
    .factura .row { display: flex; justify-content: space-between; border-bottom: 1px dotted #c5d4c9; padding: 6px 0; }
    .factura .total { font-size: 15px; font-weight: 700; color: #2d5a3d; }
    .firma { margin-top: 32px; display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: end; }
    .firma-cell { text-align: center; min-width: 0; }
    .firma-pad {
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      min-height: 76px;
      margin-bottom: 2px;
    }
    .firma-line { border-top: 1px solid #2d5a3d; width: 100%; flex-shrink: 0; }
    .firma-img {
      max-height: 58px;
      max-width: min(240px, 100%);
      width: auto;
      object-fit: contain;
      object-position: bottom center;
      display: block;
      margin: 0 auto 1px;
      flex-shrink: 0;
    }
    .firma-caption { font-size: 10px; color: #6b7c6f; margin: 4px 0 0; line-height: 1.3; }
    .meta, .muted { font-size: 10px; color: #6b7c6f; margin-top: 8px; }
    .view-link { margin-top: 8px; font-size: 10px; word-break: break-all; }
    @media print {
      @page { size: A4 portrait; margin: 12mm; }
      html, body { width: 210mm; }
      body { padding: 0; }
      .sheet-break { page-break-before: always; }
      h2, h3.sub { break-after: avoid; }
      .factura, .firma { break-inside: avoid-page; page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <img src="${escapeHtml(options.logoUrl)}" alt="Bosque Mágico" />
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

  <div class="sheet sheet-break">
    ${cateringHtml}
    ${extrasHtml}

    <h2>Extras permitidos (referencia)</h2>
    <p class="muted">Servicios no incluidos en la cotización; sujeto a tarifa vigente y disponibilidad.</p>
    <ul class="compact">${extrasPermitidos}</ul>

    <h2>Términos y condiciones</h2>
    <div class="terms"><ol>${clausulas}</ol></div>
    <p class="meta">Versión ${CONTRATO_TERMINOS_VERSION} · Horario acordado: ${horario}</p>
  </div>

  <div class="sheet sheet-break">
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
      ${buildFirmaCell('Firma del cliente', options.firmaClienteUrl)}
      ${buildFirmaCell('Bosque Mágico', options.firmaEmpresaUrl)}
    </div>
    <div class="grid" style="margin-top:24px">
      <div class="field"><div class="lbl">Nombre</div><div class="val">${escapeHtml(ctx.cliente.nombreCompleto)}</div></div>
      <div class="field"><div class="lbl">DNI</div><div class="val">${escapeHtml(form.numeroDocumento)}</div></div>
    </div>

    <p class="meta">
      Contrato generado el ${formatFechaLarga(ctx.fechaEmision)} · Cotización ${escapeHtml(ctx.codigoCotizacion)} · Bosque Mágico
      ${viewLink ? `<br/><span class="view-link">Ver en línea: ${viewLink}</span>` : ''}
    </p>
  </div>
  ${autoPrintScript}
</body>
</html>`;
}
