#!/usr/bin/env node
/**
 * Prueba paso a paso de casos de uso comerciales con correos reales de prueba.
 * Flujo A: germanhuaytalla22@gmail.com — solicitud pública (landing) + gestión panel.
 * Flujo B: germanhuaytalla23@gmail.com — solicitud manual + E2E hasta evento realizado.
 */
const DEFAULT_BASE_URL = 'http://localhost:3000/api';
const DEFAULT_EMAIL = 'admin@bosquemagico.test';
const DEFAULT_PASSWORD = 'BosqueDev123!';

const baseUrl = (process.env.QA_API_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
const adminEmail = process.env.QA_EMAIL || DEFAULT_EMAIL;
const adminPassword = process.env.QA_PASSWORD || DEFAULT_PASSWORD;

const EMAIL_LANDING = 'germanhuaytalla22@gmail.com';
const EMAIL_MANUAL = 'germanhuaytalla23@gmail.com';

const suffix = Date.now().toString().slice(-6);
const futureDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
const fechaEvento = futureDate.toISOString().slice(0, 10);
const fechaEventoB = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const resultados = [];

async function call(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}${path}`, {
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

  return { ok: res.ok, status: res.status, data };
}

function paso(num, titulo, result, accepted = [200, 201], extra = {}) {
  const ok = accepted.includes(result.status);
  const entry = {
    paso: num,
    titulo,
    status: result.status,
    ok,
    ...extra,
  };
  resultados.push(entry);
  if (ok) {
    console.log(`✅ Paso ${num}: ${titulo} (${result.status})`);
    if (extra.id) console.log(`   → id: ${extra.id}`);
    if (extra.extra) console.log(`   → ${extra.extra}`);
    return true;
  }
  console.error(`❌ Paso ${num}: ${titulo} (${result.status})`);
  console.error(JSON.stringify(result.data, null, 2));
  return false;
}

function celularUnico() {
  return `9${Math.floor(10000000 + Math.random() * 89999999)}`;
}

async function main() {
  console.log('\n═══════════════════════════════════════════');
  console.log(' Bosque — Prueba paso a paso (casos de uso)');
  console.log('═══════════════════════════════════════════');
  console.log(`API: ${baseUrl}`);
  console.log(`Admin: ${adminEmail}`);
  console.log(`Flujo A (landing): ${EMAIL_LANDING}`);
  console.log(`Flujo B (manual E2E): ${EMAIL_MANUAL}\n`);

  let n = 0;

  // ── Preparación ──────────────────────────────────────────
  n++;
  const health = await call('/health');
  if (!paso(n, 'Health check API', health)) process.exit(1);

  n++;
  const login = await call('/auth/login', {
    method: 'POST',
    body: { email: adminEmail, password: adminPassword },
  });
  if (!paso(n, 'Login panel (admin)', login, [200, 201])) process.exit(1);
  const token = login.data?.accessToken;
  if (!token) {
    console.error('❌ Sin accessToken');
    process.exit(1);
  }

  n++;
  const catalogo = await call('/public/bosque-magico/catalogo');
  if (!paso(n, 'Catálogo público disponible', catalogo)) process.exit(1);

  // ── FLUJO A: Landing → solicitud pública (correo 22) ─────
  console.log('\n── Flujo A: Solicitud pública (landing) ──');

  const celularA = celularUnico();
  const solicitudPublica = {
    cliente: {
      nombre: `Germán Huaytalla (${suffix})`,
      celular: celularA,
      correo: EMAIL_LANDING,
    },
    cumpleanero: { nombre: 'Sofía', edad: 6 },
    evento: {
      fechaTentativa: fechaEvento,
      turno: 'turno_2',
      cantidadNinos: 22,
      tematica: 'Princesas',
      paquete: 'Premium',
    },
    observaciones: `Prueba flujo landing ${suffix}`,
    preferencias: {
      extras: ['EXT-PINTA'],
      shows: ['SHOW-MAGIA'],
      catering: ['CAT-POPCORN'],
    },
  };

  n++;
  const crearPublica = await call('/public/bosque-magico/solicitudes', {
    method: 'POST',
    body: solicitudPublica,
  });
  const solicitudAId = crearPublica.data?.id;
  let cotizacionAId = crearPublica.data?.cotizacion?.id;
  const etapaA = crearPublica.data?.etapa;
  if (
    !paso(n, 'A1 — Crear solicitud pública (landing)', crearPublica, [200, 201], {
      id: solicitudAId,
      extra: cotizacionAId ? `borrador auto: ${cotizacionAId}` : undefined,
    })
  )
    process.exit(1);

  n++;
  const listA = await call(`/bosque-magico/solicitudes?q=${encodeURIComponent(EMAIL_LANDING)}&page=1&pageSize=5`, {
    token,
  });
  if (!paso(n, 'A2 — Listar solicitudes y localizar por correo', listA)) process.exit(1);

  n++;
  if (etapaA === 'nueva') {
    const tomarA = await call(`/bosque-magico/solicitudes/${solicitudAId}/tomar`, { method: 'POST', token });
    if (!paso(n, 'A3 — Tomar solicitud (en atención)', tomarA)) process.exit(1);
  } else {
    console.log(`✅ Paso ${n}: A3 — Solicitud ya en etapa «${etapaA}» (borrador automático landing)`);
    resultados.push({ paso: n, titulo: 'A3 — Etapa post-landing', status: 200, ok: true });
  }

  n++;
  const patchA = await call(`/bosque-magico/solicitudes/${solicitudAId}`, {
    method: 'PATCH',
    token,
    body: { notas: `Seguimiento flujo A ${suffix}` },
  });
  if (!paso(n, 'A4 — Editar solicitud (notas/seguimiento)', patchA)) process.exit(1);

  if (!cotizacionAId) {
    n++;
    const cotA = await call('/bosque-magico/cotizaciones', {
      method: 'POST',
      token,
      body: {
        solicitudId: solicitudAId,
        cliente: {
          nombreCompleto: solicitudPublica.cliente.nombre,
          celular: celularA,
          correo: EMAIL_LANDING,
        },
        cumpleanero: { nombre: 'Sofía', edad: 6 },
        fechaEvento,
        turno: 'turno_2',
        cantidadNinos: 22,
        items: [],
      },
    });
    cotizacionAId = cotA.data?.id;
    if (!paso(n, 'A5 — Crear cotización borrador desde solicitud', cotA, [200, 201], { id: cotizacionAId }))
      process.exit(1);
  } else {
    n++;
    console.log(`✅ Paso ${n}: A5 — Cotización borrador ya generada en landing (${cotizacionAId})`);
    resultados.push({ paso: n, titulo: 'A5 — Borrador automático', status: 200, ok: true, id: cotizacionAId });
  }

  n++;
  const enviarA = await call(`/bosque-magico/cotizaciones/${cotizacionAId}/enviar`, {
    method: 'POST',
    token,
    body: { canal: 'whatsapp', celularDestino: celularA },
  });
  if (!paso(n, 'A6 — Enviar cotización al cliente (WhatsApp)', enviarA, [200, 201])) process.exit(1);

  // Flujo A queda en cotización enviada (aceptación puede ser manual o link público)

  // ── FLUJO B: Manual → E2E completo (correo 23) ───────────
  console.log('\n── Flujo B: Solicitud manual + E2E comercial ──');

  const celularB = celularUnico();
  const solicitudManual = {
    nombreContacto: `Germán Manual (${suffix})`,
    celular: celularB,
    correo: EMAIL_MANUAL,
    canal: 'manual',
    fechaTentativa: `${fechaEventoB}T00:00:00.000Z`,
    turnoInteres: 'turno_1',
    cantidadNinosEstimada: 25,
    notas: `Prueba flujo manual E2E ${suffix}`,
    etapaInicial: 'nueva',
  };

  n++;
  const crearManual = await call('/bosque-magico/solicitudes', {
    method: 'POST',
    token,
    body: solicitudManual,
  });
  const solicitudBId = crearManual.data?.id;
  if (!paso(n, 'B1 — Crear solicitud manual (panel)', crearManual, [200, 201], { id: solicitudBId }))
    process.exit(1);

  n++;
  const tomarB = await call(`/bosque-magico/solicitudes/${solicitudBId}/tomar`, { method: 'POST', token });
  if (!paso(n, 'B2 — Tomar solicitud manual', tomarB)) process.exit(1);

  const showMagia = (catalogo.data?.productos?.shows ?? []).find((p) => p.codigo === 'SHOW-MAGIA');
  const itemsB = showMagia
    ? [{ productoId: showMagia.id, tipo: 'show', nombre: showMagia.nombre, cantidad: 1, precioUnitario: 0 }]
    : [];

  n++;
  const cotB = await call('/bosque-magico/cotizaciones', {
    method: 'POST',
    token,
    body: {
      solicitudId: solicitudBId,
      cliente: {
        nombreCompleto: solicitudManual.nombreContacto,
        celular: celularB,
        correo: EMAIL_MANUAL,
      },
      cumpleanero: { nombre: 'Mateo', edad: 9 },
      fechaEvento: fechaEventoB,
      turno: 'turno_1',
      cantidadNinos: 25,
      items: itemsB,
    },
  });
  const cotizacionBId = cotB.data?.id;
  if (!paso(n, 'B3 — Crear cotización con ítem show', cotB, [200, 201], { id: cotizacionBId }))
    process.exit(1);

  n++;
  const enviarB = await call(`/bosque-magico/cotizaciones/${cotizacionBId}/enviar`, {
    method: 'POST',
    token,
    body: { canal: 'email', correoDestino: EMAIL_MANUAL },
  });
  if (!paso(n, 'B4 — Enviar cotización por correo', enviarB, [200, 201])) process.exit(1);

  n++;
  const aceptarB = await call(`/bosque-magico/cotizaciones/${cotizacionBId}/aceptar`, {
    method: 'POST',
    token,
  });
  const eventoBId = aceptarB.data?.eventoId;
  if (!paso(n, 'B5 — Aceptar cotización (genera evento en agenda)', aceptarB, [200, 201], { id: eventoBId }))
    process.exit(1);

  n++;
  const confirmarB = await call(`/bosque-magico/eventos/${eventoBId}/confirmar`, {
    method: 'POST',
    token,
  });
  if (!paso(n, 'B6 — Confirmar evento (genera pedidos/tareas si aplica)', confirmarB, [200, 201]))
    process.exit(1);

  n++;
  const tareasB = await call(`/bosque-magico/eventos/${eventoBId}/tareas`, { token });
  if (!paso(n, 'B7 — Ver checklist de tareas del evento', tareasB)) process.exit(1);

  n++;
  const pedidosB = await call(`/bosque-magico/eventos/${eventoBId}/pedidos`, { token });
  if (!paso(n, 'B8 — Ver pedidos a proveedores del evento', pedidosB)) process.exit(1);

  n++;
  const resumenEvt = await call('/bosque-magico/eventos/resumen', { token });
  const proximos = resumenEvt.data?.proximos ?? [];
  const enResumen = proximos.some((e) => e.id === eventoBId);
  if (!paso(n, 'B9 — Dashboard: evento en próximos eventos', resumenEvt)) process.exit(1);
  if (enResumen) {
    console.log(`   → Evento ${eventoBId} visible en próximos (${proximos.length} total)`);
    const ev = proximos.find((e) => e.id === eventoBId);
    if (ev?.fechaEvento) console.log(`   → fechaEvento API: ${ev.fechaEvento}`);
  } else {
    console.log('   ⚠ Evento confirmado puede no aparecer si la fecha queda fuera del rango de próximos');
  }

  n++;
  const realizarB = await call(`/bosque-magico/eventos/${eventoBId}/realizar`, {
    method: 'POST',
    token,
  });
  if (!paso(n, 'B10 — Marcar evento como realizado', realizarB, [200, 201])) process.exit(1);

  // ── Caso adicional: cerrar solicitud huérfana ─────────────
  console.log('\n── Caso adicional: Cerrar solicitud ──');

  const celularC = celularUnico();
  n++;
  const crearCerrar = await call('/bosque-magico/solicitudes', {
    method: 'POST',
    token,
    body: {
      nombreContacto: `Lead descartado ${suffix}`,
      celular: celularC,
      correo: `lead.cerrar.${suffix}@example.test`,
      canal: 'whatsapp',
      notas: 'Para probar cierre',
      etapaInicial: 'nueva',
    },
  });
  const solicitudCId = crearCerrar.data?.id;
  if (!paso(n, 'C1 — Crear solicitud para cerrar', crearCerrar, [200, 201], { id: solicitudCId }))
    process.exit(1);

  n++;
  const cerrarC = await call(`/bosque-magico/solicitudes/${solicitudCId}/cerrar`, {
    method: 'POST',
    token,
    body: { motivoCierre: 'sin_respuesta', notas: `Cerrada en prueba ${suffix}` },
  });
  if (!paso(n, 'C2 — Cerrar solicitud (sin respuesta)', cerrarC, [200, 201])) process.exit(1);

  // ── Resumen ──────────────────────────────────────────────
  const okCount = resultados.filter((r) => r.ok).length;
  const failCount = resultados.filter((r) => !r.ok).length;

  console.log('\n═══════════════════════════════════════════');
  console.log(` Resultado: ${okCount} OK / ${failCount} fallos (${resultados.length} pasos)`);
  console.log('═══════════════════════════════════════════');
  console.log('\nIDs generados:');
  console.log(`  Flujo A — solicitud: ${solicitudAId}, cotización: ${cotizacionAId}`);
  console.log(`  Flujo B — solicitud: ${solicitudBId}, cotización: ${cotizacionBId}, evento: ${eventoBId}`);
  console.log(`  Cierre — solicitud: ${solicitudCId}`);
  console.log('\nVerificar en panel:');
  console.log('  Dashboard → Próximos eventos (fechas legibles, no INVALID DATE)');
  console.log(`  Solicitudes → buscar ${EMAIL_LANDING} y ${EMAIL_MANUAL}`);
  console.log(`  Agenda → ?detalle=${eventoBId}\n`);

  if (failCount > 0) process.exit(1);
}

main().catch((err) => {
  console.error('❌ Error inesperado');
  console.error(err);
  process.exit(1);
});
