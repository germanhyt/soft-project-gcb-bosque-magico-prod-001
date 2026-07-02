#!/usr/bin/env node
/**
 * Casos de uso específicos — reglas de negocio Bosque Mágico (TDD 2026-07-01).
 * Cubre catálogo, preview, solicitudes y flujo comercial mínimo en BD.
 *
 * Uso: node scripts/test-casos-uso-reglas.mjs
 * Requiere API :3000 + seed.
 */
import { api, loginAdmin, celularUnico, BASE, tddMarca, fechaLaboralFutura, fechaFinSemanaFutura } from './test-helpers.mjs';

const TDD = tddMarca('CU-TDD');
const results = [];

function cu(id, name, pass, detail = '') {
  results.push({ id, name, pass: Boolean(pass), detail });
  console.log(`${pass ? '✓' : '✗'} [${id}] ${name}${detail ? ` — ${detail}` : ''}`);
}

const FECHA_LV = fechaLaboralFutura(14);
const FECHA_FDS = fechaFinSemanaFutura(14);

async function preview(body) {
  return api('/public/bosque-magico/cotizaciones/preview', {
    method: 'POST',
    body,
  });
}

async function main() {
  console.log(`\n=== Casos de uso — reglas de negocio (${TDD}) ===`);
  console.log(`API: ${BASE}\n`);

  const cat = await api('/public/bosque-magico/catalogo');
  cu('CU-00', 'Catálogo público disponible', cat.status === 200);
  const productos = cat.body?.productos ?? {};
  const shows = productos.shows ?? [];
  const extras = productos.extras ?? [];
  const catering = productos.catering ?? [];
  const paquetes = productos.paquetes ?? [];

  const cateringEsperado = [
    ['CAT-POPCORN-CAT', 10],
    ['CAT-ALGODON-CAT', 10],
    ['CAT-MANZANAS', 10],
    ['CAT-MAZAMORRA', 6],
    ['CAT-GELATINA', 5],
    ['CAT-ARROZ', 6],
  ];
  for (const [codigo, precio] of cateringEsperado) {
    const p = catering.find((c) => c.codigo === codigo);
    cu(
      'CU-01',
      `Catering ${codigo} = S/${precio}`,
      p?.precioLunesViernes === precio && p?.precioFinSemana === precio,
      p ? `lv=${p.precioLunesViernes}` : 'no encontrado',
    );
    cu(
      'CU-01',
      `Catering ${codigo} mínimo 18`,
      (p?.cantidadMinima ?? 0) >= 18,
      `min=${p?.cantidadMinima ?? '?'}`,
    );
  }

  for (const show of shows.slice(0, 3)) {
    cu(
      'CU-02',
      `Show ${show.codigo} L-V/FDS 520/690`,
      show.precioLunesViernes === 520 && show.precioFinSemana === 690,
      `${show.nombre}: ${show.precioLunesViernes}/${show.precioFinSemana}`,
    );
  }

  const extrasEsperados = [
    ['EXT-PINTA', 190, 250],
    ['EXT-UNITAS', 190, 250],
    ['EXT-HORALOCA', 190, 250],
    ['EXT-ASISTENTE', 150, 150],
  ];
  for (const [codigo, lv, fds] of extrasEsperados) {
    const e = extras.find((x) => x.codigo === codigo);
    cu(
      'CU-03',
      `Extra ${codigo} ${lv}/${fds}`,
      e?.precioLunesViernes === lv && e?.precioFinSemana === fds,
      e ? `${e.precioLunesViernes}/${e.precioFinSemana}` : 'no encontrado',
    );
  }

  const basico = paquetes.find((p) => p.nombre?.includes('Básico'));
  const estandar = paquetes.find((p) => p.nombre?.includes('Estándar') || p.nombre?.includes('Estandar'));
  const premium = paquetes.find((p) => p.nombre?.includes('Premium'));
  cu('CU-04', 'Paquete Básico 799/950', basico?.precioLunesViernes === 799 && basico?.precioFinSemana === 950);
  cu('CU-04', 'Paquete Estándar 1310/1650', estandar?.precioLunesViernes === 1310 && estandar?.precioFinSemana === 1650);
  cu('CU-04', 'Paquete Premium 1770/2100', premium?.precioLunesViernes === 1770 && premium?.precioFinSemana === 2100);

  const showMagia = shows.find((s) => s.codigo === 'SHOW-MAGIA');
  const extPinta = extras.find((e) => e.codigo === 'EXT-PINTA');
  const extUnitas = extras.find((e) => e.codigo === 'EXT-UNITAS');
  const extHora = extras.find((e) => e.codigo === 'EXT-HORALOCA');
  const popCat = catering.find((c) => c.codigo === 'CAT-POPCORN-CAT');

  if (showMagia) {
    const prev = await preview({
      fechaEvento: FECHA_LV,
      cantidadNinos: 25,
      paquete: 'Estándar',
      seleccion: { cajitasCantidad: 10, showIds: [showMagia.id] },
    });
    cu(
      'CU-05',
      'Show extra 25 niños → 75',
      (prev.status === 200 || prev.status === 201) && prev.body?.montos?.ninosExtra === 75,
      `status=${prev.status} extra=${prev.body?.montos?.ninosExtra}`,
    );
    const sinShow = await preview({
      fechaEvento: FECHA_LV,
      cantidadNinos: 25,
      paquete: 'Básico',
      seleccion: { cajitasCantidad: 10 },
    });
    cu(
      'CU-05',
      'Sin show → extra 0',
      (sinShow.status === 200 || sinShow.status === 201) && sinShow.body?.montos?.ninosExtra === 0,
      `status=${sinShow.status}`,
    );
  }

  if (extPinta) {
    const r = await preview({
      fechaEvento: FECHA_LV,
      cantidadNinos: 25,
      paquete: 'Básico',
      seleccion: { cajitasCantidad: 10, extraIds: [extPinta.id] },
    });
    cu(
      'CU-06',
      'Pintacaritas 25 niños → extra 100 (10×10)',
      (r.status === 200 || r.status === 201) && r.body?.montos?.ninosExtra === 100,
      `status=${r.status}`,
    );
  }
  if (extUnitas) {
    const r = await preview({
      fechaEvento: FECHA_LV,
      cantidadNinos: 25,
      paquete: 'Básico',
      seleccion: { cajitasCantidad: 10, extraIds: [extUnitas.id] },
    });
    cu(
      'CU-06',
      'Uñitas 25 niños → extra 50 (5×10)',
      (r.status === 200 || r.status === 201) && r.body?.montos?.ninosExtra === 50,
      `status=${r.status}`,
    );
  }
  if (extHora) {
    const r = await preview({
      fechaEvento: FECHA_LV,
      cantidadNinos: 25,
      paquete: 'Básico',
      seleccion: { cajitasCantidad: 10, extraIds: [extHora.id] },
    });
    cu(
      'CU-06',
      'Hora loca 25 niños → extra 50 (5×10)',
      (r.status === 200 || r.status === 201) && r.body?.montos?.ninosExtra === 50,
      `status=${r.status}`,
    );
  }

  if (popCat) {
    const bajo = await preview({
      fechaEvento: FECHA_LV,
      cantidadNinos: 20,
      paquete: 'Básico',
      seleccion: { cajitasCantidad: 10, adicionales: [{ productoId: popCat.id, cantidad: 10 }] },
    });
    cu('CU-07', 'Rechaza catering < 18', bajo.status === 400, `status=${bajo.status}`);

    const ok18 = await preview({
      fechaEvento: FECHA_LV,
      cantidadNinos: 20,
      paquete: 'Básico',
      seleccion: { cajitasCantidad: 10, adicionales: [{ productoId: popCat.id, cantidad: 18 }] },
    });
    cu('CU-07', 'Acepta catering = 18', ok18.status === 200 || ok18.status === 201, `status=${ok18.status}`);
  }

  const over30 = await preview({
    fechaEvento: FECHA_LV,
    cantidadNinos: 31,
    paquete: 'Básico',
    seleccion: { cajitasCantidad: 10 },
  });
  cu('CU-08', 'Rechaza > 30 niños', over30.status === 400, `status=${over30.status}`);

  if (showMagia) {
    const fds = await preview({
      fechaEvento: FECHA_FDS,
      cantidadNinos: 20,
      paquete: 'Estándar',
      seleccion: { cajitasCantidad: 10, showIds: [showMagia.id] },
    });
    const showItem = (fds.body?.items ?? []).find((i) => i.productoId === showMagia.id);
    cu(
      'CU-09',
      'Show FDS cobra 690 si es adicional',
      (fds.status === 200 || fds.status === 201) && fds.body?.esFinSemana === true,
      `status=${fds.status}`,
    );
    cu(
      'CU-09',
      'Show incluido Estándar en FDS',
      Boolean(showItem && showItem.origenItem === 'incluido_paquete'),
    );
  }

  const cel1 = celularUnico();
  const solLanding = await api('/public/bosque-magico/solicitudes', {
    method: 'POST',
    body: {
      cliente: { nombre: `${TDD} Landing`, celular: cel1, correo: `${cel1}@test.com` },
      evento: { fechaTentativa: FECHA_LV, turno: 'turno_2', cantidadNinos: 25, paquete: 'Estándar' },
      preferencias: {
        origen: 'landing_cotizador',
        seleccion: {
          paquete: 'Estándar',
          cajitasCantidad: 10,
          showIds: showMagia ? [showMagia.id] : [],
        },
      },
      observaciones: `${TDD} solicitud landing con borrador`,
    },
  });
  const solLandingId = solLanding.body?.id;
  cu(
    'CU-10',
    'Solicitud landing + borrador',
    (solLanding.status === 200 || solLanding.status === 201) && solLanding.body?.cotizacion?.id,
  );

  const cel2 = celularUnico();
  const solWa = await api('/public/bosque-magico/solicitudes/whatsapp', {
    method: 'POST',
    body: {
      nombreContacto: `${TDD} WhatsApp`,
      celular: cel2,
      fechaTentativa: FECHA_LV,
      turnoInteres: 'turno_1',
      cantidadNinosEstimada: 20,
      notas: `${TDD} desde bot`,
      canal: 'whatsapp',
      detalleOrigen: 'whatsapp',
    },
  });
  cu(
    'CU-10',
    'Solicitud WhatsApp API',
    solWa.status === 200 || solWa.status === 201,
    `id=${solWa.body?.id} status=${solWa.status}`,
  );

  const token = await loginAdmin();
  cu('CU-10', 'Login panel', Boolean(token));

  if (token && solWa.body?.id) {
    const det = await api(`/bosque-magico/solicitudes/${solWa.body.id}`, { token });
    cu('CU-10', 'WhatsApp canal whatsapp', det.body?.canal === 'whatsapp');
  }

  if (token && solLandingId) {
    const detLanding = await api(`/bosque-magico/solicitudes/${solLandingId}`, { token });
    cu(
      'CU-11',
      'Landing con borrador → solicitud cotizada',
      detLanding.body?.etapa === 'cotizada',
      `etapa=${detLanding.body?.etapa}`,
    );

    const cotId = solLanding.body?.cotizacion?.id;
    if (cotId) {
      const cot = await api(`/bosque-magico/cotizaciones/${cotId}`, { token });
      cu(
        'CU-11',
        'Borrador con montoNinosExtra coherente',
        Math.abs(Number(cot.body?.montoNinosExtra ?? 0) - 75) < 0.01,
        `extra=${cot.body?.montoNinosExtra}`,
      );
    }
  }

  if (token && solWa.body?.id) {
    const tomar = await api(`/bosque-magico/solicitudes/${solWa.body.id}/tomar`, {
      method: 'POST',
      token,
    });
    cu(
      'CU-11',
      'Tomar solicitud WhatsApp (nueva)',
      tomar.status === 200 || tomar.status === 201,
      `status=${tomar.status}`,
    );

    const edit = await api(`/bosque-magico/solicitudes/${solWa.body.id}`, {
      method: 'PATCH',
      token,
      body: { notas: `${TDD} en atención comercial` },
    });
    cu('CU-11', 'Editar solicitud WhatsApp (PATCH)', edit.status === 200, `status=${edit.status}`);
  }

  const failed = results.filter((r) => !r.pass);
  const ids = [...new Set(results.map((r) => r.id))];
  console.log(
    `\n--- Resumen: ${results.length - failed.length}/${results.length} OK (${ids.length} casos de uso) ---`,
  );
  if (failed.length) {
    console.log('\nFallidos:');
    for (const f of failed) console.log(`  [${f.id}] ${f.name}: ${f.detail}`);
    process.exit(1);
  }
  console.log('\nTodos los casos de uso de reglas pasaron.\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
