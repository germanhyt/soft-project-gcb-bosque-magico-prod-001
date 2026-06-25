/**
 * Integración E2E con mock/seed — landing → borrador + datos demo (24/06/2026).
 * Uso: node scripts/test-flujos-demo-paquetes.mjs
 * Requiere: API :3000, seed + seed:demo aplicados.
 */
const BASE = process.env.API_URL ?? 'http://localhost:3000/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@bosquemagico.test';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'BosqueDev123!';

const results = [];

function ok(step, name, cond, detail = '') {
  results.push({ step, name, pass: Boolean(cond), detail });
  const icon = cond ? '✓' : '✗';
  console.log(`  ${icon} ${name}${detail ? ` — ${detail}` : ''}`);
}

function section(title) {
  console.log(`\n--- ${title} ---`);
}

async function get(path, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${BASE}${path}`, { headers });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

async function post(path, payload, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

async function login() {
  const res = await post('/auth/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  return res.body?.access_token ?? res.body?.accessToken ?? null;
}

async function main() {
  console.log(`\n=== Test mock/demo paquetes — ${new Date().toISOString()} ===`);
  console.log(`API: ${BASE}\n`);

  // PASO 5A — Catálogo: subtipo + unidadesPack (seed mock)
  section('PASO 5A — Catálogo seed (subtipo / unidadesPack)');
  const cat = await get('/public/bosque-magico/catalogo');
  ok(5, 'GET catalogo', cat.status === 200);
  const piqueos = cat.body?.productos?.piqueos ?? [];
  const cajitas = cat.body?.productos?.cajitas ?? [];
  const piqSample = piqueos[0];
  ok(
    5,
    'Piqueo tiene subtipo=piqueo',
    piqSample?.subtipo === 'piqueo',
    piqSample ? `${piqSample.codigo} subtipo=${piqSample.subtipo}` : 'sin piqueos',
  );
  ok(
    5,
    'Piqueo tiene unidadesPack',
    typeof piqSample?.unidadesPack === 'number' && piqSample.unidadesPack > 0,
    piqSample ? `unidadesPack=${piqSample.unidadesPack}` : '',
  );
  ok(
    5,
    'Cajita tiene subtipo=cajita',
    cajitas.some((c) => c.subtipo === 'cajita'),
    `cajitas=${cajitas.length}`,
  );

  const piq1 = piqueos.find((p) => p.codigo === 'PIQ-001') ?? piqueos[0];
  const piq2 = piqueos.find((p) => p.codigo === 'PIQ-002') ?? piqueos[1];
  const piq3 = piqueos.find((p) => p.codigo === 'PIQ-020') ?? piqueos[2];
  const shows = cat.body?.productos?.shows ?? [];
  const show1 = shows[0];

  // PASO 5B — Preview mock (misma selección que landing)
  section('PASO 5B — Preview mock Premium + selección landing');
  const fechaLv = '2026-07-08';
  const seleccionMock = {
    cajitasCantidad: 12,
    showIds: show1 ? [show1.id] : [],
    piqueos: [
      { productoId: piq1?.id, cantidad: 1 },
      { productoId: piq2?.id, cantidad: 1 },
      { productoId: piq3?.id, cantidad: 1 },
    ],
  };
  const preview = await post('/public/bosque-magico/cotizaciones/preview', {
    fechaEvento: fechaLv,
    cantidadNinos: 25,
    paquete: 'Premium',
    seleccion: seleccionMock,
  });
  ok(5, 'Preview mock → 200', preview.status === 200 || preview.status === 201);
  const exCaj = preview.body?.resumenPaquete?.cajitasExcedente;
  ok(5, 'Cajitas 12 → excedente 2', exCaj === 2, `excedente=${exCaj}`);
  ok(
    5,
    'Piqueos excedente 62.5',
    Math.abs((preview.body?.resumenPaquete?.piqueosExcedente ?? 0) - 62.5) < 0.01,
    `excedente=${preview.body?.resumenPaquete?.piqueosExcedente}`,
  );
  const montoPreview = preview.body?.montos?.total;

  // PASO 5C — Landing POST → borrador automático
  section('PASO 5C — Solicitud landing → cotización borrador');
  const celularUnico = `9${String(Date.now()).slice(-8)}`;
  const solicitud = await post('/public/bosque-magico/solicitudes', {
    cliente: {
      nombre: 'Test Mock Paquetes',
      celular: celularUnico,
      correo: 'mock.paquetes@test.com',
    },
    cumpleanero: { nombre: 'Valentina', edad: 6 },
    evento: {
      fechaTentativa: fechaLv,
      turno: 'turno_2',
      cantidadNinos: 25,
      paquete: 'Premium',
      tematica: 'Unicornios',
    },
    preferencias: {
      origen: 'landing_cotizador',
      seleccion: {
        paquete: 'Premium',
        ...seleccionMock,
      },
    },
    observaciones: 'Test mock E2E paquetes 24/06',
  });
  ok(5, 'POST solicitud → 201/200', solicitud.status === 201 || solicitud.status === 200, `status=${solicitud.status}`);
  const cotBorrador = solicitud.body?.cotizacion;
  ok(
    5,
    'Borrador auto creado',
    Boolean(cotBorrador?.id && cotBorrador?.codigo),
    cotBorrador ? `${cotBorrador.codigo} (${cotBorrador.etapa})` : 'sin cotizacion',
  );

  // PASO 5D — Panel auth + detalle cotización mock
  section('PASO 5D — Panel: detalle borrador vs preview');
  const token = await login();
  ok(5, 'Login panel', Boolean(token));
  if (token && cotBorrador?.id) {
    const det = await get(`/bosque-magico/cotizaciones/${cotBorrador.id}`, token);
    ok(5, 'GET cotización borrador', det.status === 200, `status=${det.status}`);
    ok(
      5,
      'Paquete Premium en borrador',
      det.body?.paquete === 'Premium' || det.body?.productoPaquete?.nombre?.includes('Premium'),
      `paquete=${det.body?.paquete ?? det.body?.productoPaquete?.nombre}`,
    );
    ok(
      5,
      'Monto total coherente con preview',
      montoPreview != null &&
        Math.abs((det.body?.montoTotal ?? 0) - montoPreview) < 0.02,
      `borrador=${det.body?.montoTotal} preview=${montoPreview}`,
    );
    const itemsOrigen = (det.body?.items ?? []).filter((i) => i.origenItem);
    ok(
      5,
      'Ítems con origenItem (incluido/excedente)',
      itemsOrigen.length >= 3,
      `con origen=${itemsOrigen.length}`,
    );
  }

  // PASO 5E — Seed demo operativo
  section('PASO 5E — Registros seed demo');
  if (token) {
    const sols = await get('/bosque-magico/solicitudes?limit=50', token);
    ok(5, 'GET solicitudes panel', sols.status === 200);
    const solItems = sols.body?.items ?? sols.body?.data ?? [];
    const demoSols = (Array.isArray(solItems) ? solItems : []).filter(
      (s) => s.detalleOrigen === 'seed_demo' || s.nombreContacto?.includes('Demo'),
    );
    ok(5, 'Solicitudes demo presentes', demoSols.length >= 2, `count=${demoSols.length}`);

    const cots = await get('/bosque-magico/cotizaciones?limit=50', token);
    ok(5, 'GET cotizaciones panel', cots.status === 200);
    const lista = cots.body?.items ?? cots.body?.data ?? [];
    const cotDemo = lista.find((c) => c.codigo === 'COT-DEMO-001');
    ok(
      5,
      'COT-DEMO-001 existe',
      Boolean(cotDemo),
      cotDemo ? `${cotDemo.codigo} etapa=${cotDemo.etapa}` : 'no encontrada',
    );
    const cotOps = lista.find((c) => c.codigo === 'COT-DEMO-OPS-001');
    ok(
      5,
      'COT-DEMO-OPS-001 existe',
      Boolean(cotOps),
      cotOps ? `${cotOps.codigo} monto=${cotOps.montoTotal}` : 'no encontrada',
    );
  }

  const failed = results.filter((r) => !r.pass);
  console.log(`\n=== Resumen demo/mock: ${results.length - failed.length}/${results.length} OK ===`);
  if (failed.length) {
    console.log('\nFallidos:');
    for (const f of failed) console.log(`  [PASO ${f.step}] ${f.name}: ${f.detail}`);
    process.exit(1);
  }
  console.log('\nFlujos mock/demo completados.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
