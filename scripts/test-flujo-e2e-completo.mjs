#!/usr/bin/env node
/**
 * Flujo comercial E2E completo — landing → evento realizado (TDD fecha del día).
 *
 * Cadena:
 *   Solicitud landing → borrador → enviar → aceptar → contrato + firmas → confirmar → realizado
 *
 * Reglas validadas en camino: Estándar 25 niños + show → extra 5×15 = 75
 *
 * Uso: node scripts/test-flujo-e2e-completo.mjs
 * Requiere: API :3000 + seed + admin login
 */
import { subirFirmaContrato, tddMarca } from './test-helpers.mjs';

const BASE = (process.env.QA_API_URL || process.env.API_URL || 'http://localhost:3000/api').replace(
  /\/+$/,
  '',
);
const ADMIN_EMAIL = process.env.QA_EMAIL || process.env.ADMIN_EMAIL || 'admin@bosquemagico.test';
const ADMIN_PASSWORD = process.env.QA_PASSWORD || process.env.ADMIN_PASSWORD || 'BosqueDev123!';
const MARCA = tddMarca('E2E-FULL');
/** WhatsApp evita SMTP en envío de cotización (correo de solicitud puede ser ficticio). */
const CELULAR_ENVIO = process.env.QA_CELULAR || '910139973';

const suffix = Date.now().toString().slice(-6);
const fechaEvento = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const email = `e2e.full.${suffix}@test.bosquemagico.local`;
const celular = `9${String(Date.now()).slice(-8)}`;

const steps = [];

async function call(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

function step(num, title, result, accepted = [200, 201], extra = '') {
  const ok = accepted.includes(result.status);
  steps.push({ num, title, ok, status: result.status, extra });
  if (ok) {
    console.log(`✅ F${String(num).padStart(2, '0')} — ${title} (${result.status})${extra ? ` · ${extra}` : ''}`);
    return true;
  }
  console.error(`❌ F${String(num).padStart(2, '0')} — ${title} (${result.status})`);
  console.error(JSON.stringify(result.data, null, 2));
  return false;
}

async function main() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log(' Bosque Mágico — Flujo E2E completo (inicio → realizado)');
  console.log('══════════════════════════════════════════════════════');
  console.log(`API:     ${BASE}`);
  console.log(`Fecha:   ${fechaEvento} (+14 días)`);
  console.log(`Cliente: ${email} / ${celular}`);
  console.log(`Marca:   ${MARCA}\n`);

  let n = 0;
  let token;
  let solicitudId;
  let cotizacionId;
  let cotizacionToken;
  let eventoId;
  let contratoId;

  n++;
  if (!step(n, 'Health check', await call('/health'))) process.exit(1);

  n++;
  const login = await call('/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  if (!step(n, 'Login panel admin', login, [200, 201])) process.exit(1);
  token = login.data?.accessToken;
  if (!token) {
    console.error('Sin accessToken');
    process.exit(1);
  }

  n++;
  const cat = await call('/public/bosque-magico/catalogo');
  if (!step(n, 'Catálogo público', cat)) process.exit(1);
  const showMagia = (cat.data?.productos?.shows ?? []).find((s) => s.codigo === 'SHOW-MAGIA');
  if (!showMagia) {
    console.error('SHOW-MAGIA no encontrado en catálogo');
    process.exit(1);
  }

  n++;
  const preview = await call('/public/bosque-magico/cotizaciones/preview', {
    method: 'POST',
    body: {
      fechaEvento,
      cantidadNinos: 25,
      paquete: 'Estándar',
      seleccion: { cajitasCantidad: 10, showIds: [showMagia.id] },
    },
  });
  if (!step(n, 'Preview Estándar 25+show', preview, [200, 201])) process.exit(1);
  const extraPreview = preview.data?.montos?.ninosExtra;
  n++;
  if (
    !step(
      n,
      'Preview extra capacidad = 75 (5×15)',
      { status: Math.abs(Number(extraPreview) - 75) < 0.01 ? 200 : 400, data: preview.data },
      [200],
      `ninosExtra=${extraPreview}`,
    )
  )
    process.exit(1);

  n++;
  const sol = await call('/public/bosque-magico/solicitudes', {
    method: 'POST',
    body: {
      cliente: {
        nombre: `E2E Full ${suffix}`,
        celular,
        correo: email,
      },
      cumpleanero: { nombre: 'Valentina', edad: 6 },
      evento: {
        fechaTentativa: fechaEvento,
        turno: 'turno_2',
        cantidadNinos: 25,
        tematica: 'Unicornios',
        paquete: 'Estándar',
      },
      preferencias: {
        origen: 'landing_cotizador',
        seleccion: {
          paquete: 'Estándar',
          cajitasCantidad: 10,
          showIds: [showMagia.id],
        },
      },
      observaciones: `${MARCA} flujo completo landing→realizado`,
      origen: { detalle: 'landing' },
    },
  });
  if (!step(n, 'Crear solicitud landing', sol, [200, 201], `id=${sol.data?.id}`)) process.exit(1);
  solicitudId = sol.data?.id;
  cotizacionId = sol.data?.cotizacion?.id;

  n++;
  const detSol = await call(`/bosque-magico/solicitudes/${solicitudId}`, { token });
  if (!step(n, 'Solicitud en etapa cotizada', detSol, [200], `etapa=${detSol.data?.etapa}`)) process.exit(1);
  if (detSol.data?.etapa !== 'cotizada') process.exit(1);

  if (!cotizacionId) {
    n++;
    const gen = await call(`/bosque-magico/solicitudes/${solicitudId}/generar-cotizacion-borrador`, {
      method: 'POST',
      token,
    });
    cotizacionId = gen.data?.cotizacion?.id ?? gen.data?.id;
    if (!step(n, 'Generar borrador desde solicitud', gen, [200, 201], cotizacionId)) process.exit(1);
  } else {
    n++;
    console.log(`✅ F${String(n).padStart(2, '0')} — Borrador auto landing (${cotizacionId})`);
    steps.push({ num: n, title: 'Borrador auto', ok: true, status: 200, extra: cotizacionId });
  }

  n++;
  const detCot = await call(`/bosque-magico/cotizaciones/${cotizacionId}`, { token });
  const montoExtra = Number(detCot.data?.montoNinosExtra ?? 0);
  if (!step(n, 'Borrador montoNinosExtra=75', detCot, [200], `extra=${montoExtra}`)) process.exit(1);
  if (Math.abs(montoExtra - 75) >= 0.01) process.exit(1);
  cotizacionToken = detCot.data?.tokenPublico;

  n++;
  const enviar = await call(`/bosque-magico/cotizaciones/${cotizacionId}/enviar`, {
    method: 'POST',
    token,
    body: { canal: 'whatsapp', celularDestino: CELULAR_ENVIO },
  });
  if (!step(n, 'Enviar cotización (WhatsApp, sin SMTP)', enviar, [200, 201])) process.exit(1);

  n++;
  const cotEnviada = await call(`/bosque-magico/cotizaciones/${cotizacionId}`, { token });
  if (
    !step(
      n,
      'Cotización etapa enviada',
      cotEnviada,
      [200],
      `etapa=${cotEnviada.data?.etapa}`,
    )
  )
    process.exit(1);

  n++;
  const aceptar = await call(`/bosque-magico/cotizaciones/${cotizacionId}/aceptar`, {
    method: 'POST',
    token,
  });
  eventoId = aceptar.data?.eventoId ?? aceptar.data?.evento?.id;
  if (!step(n, 'Aceptar cotización → crear evento', aceptar, [200, 201], `evento=${eventoId}`))
    process.exit(1);
  if (!eventoId) process.exit(1);

  n++;
  const detEvt = await call(`/bosque-magico/eventos/${eventoId}`, { token });
  if (
    !step(
      n,
      'Evento por_confirmar',
      detEvt,
      [200],
      `etapa=${detEvt.data?.etapa}`,
    )
  )
    process.exit(1);

  n++;
  const contrato = await call(`/bosque-magico/eventos/${eventoId}/contrato`, {
    method: 'POST',
    token,
    body: {
      numeroDocumento: '70998877',
      tipoComprobante: 'boleta',
      documentoTributario: '70998877',
      horarioInicio: '15:00',
      horarioFin: '18:00',
      adelanto1Monto: 500,
      adelanto1Fecha: fechaEvento,
    },
  });
  contratoId = contrato.data?.id;
  if (!step(n, 'Generar contrato del evento', contrato, [200, 201], `id=${contratoId}`))
    process.exit(1);

  n++;
  const firmaCli = await subirFirmaContrato(contratoId, 'firma_cliente', token);
  if (
    !step(
      n,
      'Subir firma cliente (adjunto)',
      { status: firmaCli.status, data: firmaCli.body },
      [200, 201],
    )
  )
    process.exit(1);

  n++;
  const firmaEmp = await subirFirmaContrato(contratoId, 'firma_empresa', token);
  if (
    !step(
      n,
      'Subir firma empresa (adjunto)',
      { status: firmaEmp.status, data: firmaEmp.body },
      [200, 201],
    )
  )
    process.exit(1);

  n++;
  const detContrato = await call(`/bosque-magico/contratos/${contratoId}`, { token });
  const adjuntos = detContrato.data?.adjuntos ?? [];
  const tieneFirmas =
    adjuntos.some((a) => a.tipo === 'firma_cliente') &&
    adjuntos.some((a) => a.tipo === 'firma_empresa');
  if (
    !step(
      n,
      'Contrato con adjuntos de firma',
      detContrato,
      [200],
      `firmas=${tieneFirmas}`,
    )
  )
    process.exit(1);
  if (!tieneFirmas) process.exit(1);

  n++;
  if (
    !step(
      n,
      'Enviar contrato',
      await call(`/bosque-magico/contratos/${contratoId}/enviar`, { method: 'POST', token }),
      [200, 201],
    )
  )
    process.exit(1);

  if (contrato.data?.tokenPublico) {
    n++;
    const pub = await call(`/public/bosque-magico/contratos/${contrato.data.tokenPublico}`);
    const pubAdj = pub.data?.adjuntos ?? [];
    const pubFirmas =
      pubAdj.some((a) => a.tipo === 'firma_cliente') &&
      pubAdj.some((a) => a.tipo === 'firma_empresa');
    if (
      !step(
        n,
        'Contrato público incluye firmas',
        pub,
        [200],
        `firmas=${pubFirmas}`,
      )
    )
      process.exit(1);
    if (!pubFirmas) process.exit(1);
  }

  n++;
  const pedidosPre = await call(`/bosque-magico/eventos/${eventoId}/pedidos`, { token });
  const pedidosProv = (pedidosPre.data ?? []).filter((p) => p.tipo === 'proveedor');
  for (const p of pedidosProv) {
    await call(`/bosque-magico/pedidos/${p.id}`, {
      method: 'PATCH',
      token,
      body: { etapa: 'confirmado' },
    });
  }
  console.log(
    `✅ F${String(n).padStart(2, '0')} — Confirmar pedidos proveedor (${pedidosProv.length})`,
  );
  steps.push({
    num: n,
    title: 'Pedidos proveedor confirmados',
    ok: true,
    status: 200,
    extra: String(pedidosProv.length),
  });

  n++;
  if (
    !step(
      n,
      'Confirmar evento en agenda',
      await call(`/bosque-magico/eventos/${eventoId}/confirmar`, { method: 'POST', token }),
      [200, 201],
    )
  )
    process.exit(1);

  n++;
  const evtConfirmado = await call(`/bosque-magico/eventos/${eventoId}`, { token });
  if (
    !step(
      n,
      'Evento etapa confirmado',
      evtConfirmado,
      [200],
      `etapa=${evtConfirmado.data?.etapa}`,
    )
  )
    process.exit(1);
  if (evtConfirmado.data?.etapa !== 'confirmado') process.exit(1);

  n++;
  const tareas = await call(`/bosque-magico/eventos/${eventoId}/tareas`, { token });
  if (!step(n, 'Checklist de tareas generado', tareas, [200], `count=${(tareas.data ?? []).length}`))
    process.exit(1);

  n++;
  if (!step(n, 'Pedidos del evento', await call(`/bosque-magico/eventos/${eventoId}/pedidos`, { token })))
    process.exit(1);

  n++;
  if (
    !step(
      n,
      'Marcar evento como realizado',
      await call(`/bosque-magico/eventos/${eventoId}/realizar`, { method: 'POST', token }),
      [200, 201],
    )
  )
    process.exit(1);

  n++;
  const evtFinal = await call(`/bosque-magico/eventos/${eventoId}`, { token });
  if (
    !step(
      n,
      'Evento etapa realizado',
      evtFinal,
      [200],
      `etapa=${evtFinal.data?.etapa}`,
    )
  )
    process.exit(1);
  if (evtFinal.data?.etapa !== 'realizado') process.exit(1);

  n++;
  const solFinal = await call(`/bosque-magico/solicitudes/${solicitudId}`, { token });
  if (
    !step(
      n,
      'Solicitud cerrada (ganada)',
      solFinal,
      [200],
      `etapa=${solFinal.data?.etapa} motivo=${solFinal.data?.motivoCierre ?? '—'}`,
    )
  )
    process.exit(1);

  if (cotizacionToken) {
    n++;
    const cotPub = await call(`/public/bosque-magico/cotizaciones/${cotizacionToken}`);
    if (!step(n, 'Cotización pública accesible por token', cotPub, [200])) process.exit(1);
  }

  const failed = steps.filter((s) => !s.ok);
  console.log('\n══════════════════════════════════════════════════════');
  console.log(` Resultado: ${steps.length - failed.length}/${steps.length} pasos OK`);
  console.log('══════════════════════════════════════════════════════');
  console.log('\nIDs generados:');
  console.log(`  Solicitud:  ${solicitudId}`);
  console.log(`  Cotización: ${cotizacionId}`);
  console.log(`  Evento:     ${eventoId}`);
  console.log(`  Contrato:   ${contratoId}`);
  console.log('\nVerificar en panel:');
  console.log(`  Solicitudes → buscar "${email}" o "E2E Full"`);
  console.log(`  Agenda → ?detalle=${eventoId} (realizado)`);
  console.log(`  Cotizaciones → ${cotizacionId}\n`);

  if (failed.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
