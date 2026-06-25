#!/usr/bin/env node
/**
 * QA pedidos operativos: listado, generar desde cotización, alta manual, PATCH etapa.
 * Requiere API activa. Para pedidos en /operaciones (mes→hoy): ejecutar tras db:seed:demo
 * o dejar que el script cree un evento con fechaEvento = hoy (parte generar).
 *
 * Uso:
 *   API_URL=http://localhost:3000/api \
 *   ADMIN_EMAIL=admin@bosquemagico.test \
 *   ADMIN_PASSWORD=admin@@@ \
 *   npm run qa:pedidos
 */
const API = (process.env.API_URL ?? process.env.QA_API_URL ?? 'http://localhost:3000/api').replace(
  /\/+$/,
  '',
);
const EMAIL = process.env.ADMIN_EMAIL ?? process.env.QA_EMAIL ?? 'admin@bosquemagico.test';
const PASS = process.env.ADMIN_PASSWORD ?? process.env.QA_PASSWORD ?? 'BosqueDev123!';
const ZONA_NEGOCIO = 'America/Lima';

function isoLocal(d = new Date()) {
  return d.toLocaleDateString('en-CA', { timeZone: ZONA_NEGOCIO });
}

function isoDatePlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return isoLocal(d);
}

function rangoMesHastaHoy() {
  const hoy = isoLocal();
  const [y, m] = hoy.split('-');
  return { desde: `${y}-${m}-01`, hasta: hoy };
}

async function call(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {
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

function paso(id, titulo, result, expected = [200, 201]) {
  const ok = expected.includes(result.status);
  console.log(`${ok ? '✅' : '❌'} ${id}: ${titulo} (${result.status})`);
  if (!ok) {
    console.error(JSON.stringify(result.data, null, 2));
    process.exit(1);
  }
  return result.data;
}

async function login() {
  const res = await call('/auth/login', {
    method: 'POST',
    body: { email: EMAIL, password: PASS },
  });
  if (![200, 201].includes(res.status) || !res.data?.accessToken) {
    console.error('❌ Login falló');
    process.exit(1);
  }
  return res.data.accessToken;
}

async function main() {
  console.log('\nBosque QA — pedidos operativos');
  console.log(`API: ${API}\n`);

  const token = await login();
  const { desde, hasta } = rangoMesHastaHoy();
  const hoy = isoLocal();
  const suffix = Date.now().toString().slice(-6);
  const fechaEventoGen = isoDatePlus(21 + (parseInt(suffix, 10) % 14));
  const turnoGen = parseInt(suffix, 10) % 2 === 0 ? 'turno_1' : 'turno_2';

  // ── A) Pedidos del evento demo (seed) ─────────────────────
  console.log('── A: Pedidos evento demo (seed) ──');

  let listOps = await call(`/bosque-magico/pedidos?desde=${desde}&hasta=${hasta}`, { token });
  paso('P1', `Listar operaciones (${desde}…${hasta})`, listOps);

  let eventoDemoId;
  let pedidoSeedId;
  let countInicial = 0;

  if (!Array.isArray(listOps.data) || listOps.data.length === 0) {
    console.log('⚠️  Sin pedidos en rango — se omite bloque A (seed). Continúa bloque B.\n');
  } else {
    eventoDemoId = listOps.data[0].evento?.id ?? listOps.data[0].eventoId;
    pedidoSeedId = listOps.data[0].id;

    let pedidosEvt = await call(`/bosque-magico/eventos/${eventoDemoId}/pedidos`, { token });
    paso('P2', 'Listar pedidos del evento demo', pedidosEvt);
    countInicial = pedidosEvt.data?.length ?? 0;
    if (countInicial < 1) {
      console.log('⚠️  Evento demo sin pedidos — se omite resto del bloque A.\n');
    } else {
      const patch1 = await call(`/bosque-magico/pedidos/${pedidoSeedId}`, {
        method: 'PATCH',
        token,
        body: { etapa: 'confirmado', notas: `QA pedidos ${suffix}` },
      });
      paso('P3', 'PATCH pedido seed → confirmado', patch1);

      const crearManual = await call(`/bosque-magico/eventos/${eventoDemoId}/pedidos`, {
        method: 'POST',
        token,
        body: {
          tipo: 'interno',
          nombre: `Pedido interno QA ${suffix}`,
          cantidad: 1,
          area: 'operaciones',
          costo: 85,
          fechaRequerida: hoy,
          notas: 'Alta manual QA',
        },
      });
      const pedidoManual = paso('P4', 'POST pedido manual (interno)', crearManual);
      const pedidoManualId = pedidoManual?.id;
      if (!pedidoManualId) {
        console.error('❌ POST pedido manual no devolvió id');
        process.exit(1);
      }

      const patch2 = await call(`/bosque-magico/pedidos/${pedidoManualId}`, {
        method: 'PATCH',
        token,
        body: { etapa: 'confirmado', costo: 90 },
      });
      paso('P5', 'PATCH pedido manual → confirmado + costo', patch2);

      pedidosEvt = await call(`/bosque-magico/eventos/${eventoDemoId}/pedidos`, { token });
      paso('P6', 'Verificar pedidos del evento (≥ inicial + 1)', pedidosEvt);
      if ((pedidosEvt.data?.length ?? 0) < countInicial + 1) {
        console.error('❌ No se reflejó el pedido manual');
        process.exit(1);
      }

      listOps = await call(`/bosque-magico/pedidos?desde=${desde}&hasta=${hasta}`, { token });
      paso('P7', 'Listar operaciones tras altas', listOps);
      const idsOps = new Set((listOps.data ?? []).map((p) => p.id));
      if (!idsOps.has(pedidoManualId)) {
        console.error('❌ Pedido manual no aparece en vista operaciones');
        process.exit(1);
      }
    }
  }

  // ── B) Generar desde cotización (evento nuevo, hoy) ───────
  console.log('\n── B: Generar pedidos desde cotización ──');

  const catalogo = await call('/public/bosque-magico/catalogo');
  paso('P8', 'Catálogo público', catalogo);

  const showMimo =
    (catalogo.data?.productos?.shows ?? []).find((p) => p.codigo === 'SHOW-MIMO') ??
    (catalogo.data?.productos?.shows ?? []).find((p) => p.codigo === 'SHOW-MAGIA');

  if (!showMimo) {
    console.error('❌ Falta producto SHOW-MIMO o SHOW-MAGIA en catálogo');
    process.exit(1);
  }

  const celularPed = process.env.QA_CELULAR_PEDIDOS ?? '910139971';
  const correoPed = `qa.pedidos.${suffix}@example.test`;

  const sol = await call('/bosque-magico/solicitudes', {
    method: 'POST',
    token,
    body: {
      nombreContacto: `QA Pedidos ${suffix}`,
      celular: celularPed,
      correo: correoPed,
      canal: 'manual',
      fechaTentativa: `${fechaEventoGen}T12:00:00.000Z`,
      turnoInteres: turnoGen,
      cantidadNinosEstimada: 15,
      notas: `QA pedidos generar ${suffix}`,
      etapaInicial: 'nueva',
    },
  });
  const solicitudId = paso('P9', 'Crear solicitud para pedidos generar', sol)?.id;

  await call(`/bosque-magico/solicitudes/${solicitudId}/tomar`, { method: 'POST', token });

  const cot = await call('/bosque-magico/cotizaciones', {
    method: 'POST',
    token,
    body: {
      solicitudId,
      cliente: {
        nombreCompleto: `QA Pedidos ${suffix}`,
        celular: celularPed,
        correo: correoPed,
      },
      cumpleanero: { nombre: 'Nico', edad: 8 },
      fechaEvento: fechaEventoGen,
      turno: turnoGen,
      cantidadNinos: 15,
      paquete: 'Premium',
      items: [
        {
          productoId: showMimo.id,
          tipo: 'show',
          nombre: showMimo.nombre,
          cantidad: 1,
          precioUnitario: 240,
        },
      ],
    },
  });
  const cotizacionId = paso('P10', 'Crear cotización con ítem proveedor', cot)?.id;

  const enviar = await call(`/bosque-magico/cotizaciones/${cotizacionId}/enviar`, {
    method: 'POST',
    token,
    body: { canal: 'whatsapp', celularDestino: celularPed },
  });
  paso('P11', 'Enviar cotización (WhatsApp)', enviar);

  const aceptar = await call(`/bosque-magico/cotizaciones/${cotizacionId}/aceptar`, {
    method: 'POST',
    token,
  });
  const eventoGenId = paso('P12', 'Aceptar cotización (evento por confirmar)', aceptar)?.eventoId;
  if (!eventoGenId) {
    console.error('❌ Sin eventoId');
    process.exit(1);
  }

  let pedidosGen0 = await call(`/bosque-magico/eventos/${eventoGenId}/pedidos`, { token });
  paso('P13', 'Pedidos tras aceptar (auto-generados)', pedidosGen0);
  const countTrasAceptar = pedidosGen0.data?.length ?? 0;
  if (countTrasAceptar < 1) {
    console.error('❌ Se esperaba ≥1 pedido tras aceptar cotización con ítem proveedor');
    process.exit(1);
  }

  const generar = await call(`/bosque-magico/eventos/${eventoGenId}/pedidos/generar`, {
    method: 'POST',
    token,
  });
  const generados = paso('P14', 'POST generar idempotente (ya existían)', generar);
  if (!Array.isArray(generados) || generados.length !== 0) {
    console.error('❌ Generar debía devolver [] cuando ya hay pedidos');
    process.exit(1);
  }

  const generar2 = await call(`/bosque-magico/eventos/${eventoGenId}/pedidos/generar`, {
    method: 'POST',
    token,
  });
  paso('P15', 'POST generar idempotente (2.ª vez)', generar2);
  if (!Array.isArray(generar2.data) || generar2.data.length !== 0) {
    console.error('❌ Segunda generación debía devolver []');
    process.exit(1);
  }

  pedidosGen0 = await call(`/bosque-magico/eventos/${eventoGenId}/pedidos`, { token });
  paso('P16', 'Listar pedidos tras generar', pedidosGen0);
  if ((pedidosGen0.data?.length ?? 0) < countTrasAceptar) {
    console.error('❌ Evento sin pedidos tras generar');
    process.exit(1);
  }

  const pedidoGenId = pedidosGen0.data[0].id;
  const patchGen = await call(`/bosque-magico/pedidos/${pedidoGenId}`, {
    method: 'PATCH',
    token,
    body: { etapa: 'entregado' },
  });
  paso('P17', 'PATCH pedido generado → entregado', patchGen);

  listOps = await call(`/bosque-magico/pedidos?desde=${desde}&hasta=${fechaEventoGen}`, { token });
  paso('P18', `Operaciones incluye pedido generado (evento ${fechaEventoGen})`, listOps);
  const idsFinal = new Set((listOps.data ?? []).map((p) => p.id));
  if (!idsFinal.has(pedidoGenId)) {
    console.error('❌ Pedido generado no visible en /operaciones');
    process.exit(1);
  }

  console.log('\n✅ QA pedidos OK (18 pasos)');
  if (eventoDemoId) console.log(`   Evento demo: /agenda?detalle=${eventoDemoId}`);
  console.log(`   Evento generar: /agenda?detalle=${eventoGenId}\n`);
}

main().catch((e) => {
  console.error('❌ Error inesperado:', e);
  process.exit(1);
});
