/**
 * Smoke / integración manual — flujos paquetes + piqueos (24/06/2026).
 * Uso: node scripts/test-flujos-paquetes.mjs
 * Requiere API en http://localhost:3000 con seed aplicado.
 */
const BASE = process.env.API_URL ?? 'http://localhost:3000/api';

const results = [];

function ok(name, cond, detail = '') {
  results.push({ name, pass: Boolean(cond), detail });
  const icon = cond ? '✓' : '✗';
  console.log(`${icon} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

async function post(path, payload) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

function byNombre(list, nombre) {
  return list?.find((p) => p.nombre === nombre || p.nombre?.includes(nombre));
}

async function main() {
  console.log(`\n=== Test flujos paquetes — ${new Date().toISOString()} ===\n`);
  console.log(`API: ${BASE}\n`);

  // 1. Catálogo público
  const cat = await get('/public/bosque-magico/catalogo');
  ok('GET catalogo → 200', cat.status === 200, `status ${cat.status}`);
  const paquetes = cat.body?.productos?.paquetes ?? [];
  const basico = byNombre(paquetes, 'Básico');
  const estandar = byNombre(paquetes, 'Estándar') ?? byNombre(paquetes, 'Estandar');
  const premium = byNombre(paquetes, 'Premium');
  ok('Catálogo: 3 paquetes', paquetes.length >= 3, `count=${paquetes.length}`);
  ok(
    'Precios distintos por paquete (L-V)',
    basico?.precioLunesViernes === 380 &&
      estandar?.precioLunesViernes === 480 &&
      premium?.precioLunesViernes === 580,
    `Básico=${basico?.precioLunesViernes} Estándar=${estandar?.precioLunesViernes} Premium=${premium?.precioLunesViernes}`,
  );

  const piqueos = cat.body?.productos?.piqueos ?? [];
  ok('Catálogo: piqueos con unidadesPack', piqueos.length >= 40, `count=${piqueos.length}`);
  const tequenos = piqueos.find((p) => p.nombre?.includes('Tequeños'));
  ok(
    'Piqueo sample tiene unidadesPack',
    tequenos?.unidadesPack != null && tequenos.unidadesPack > 0,
    tequenos ? `${tequenos.nombre}: ${tequenos.unidadesPack} uds` : 'no encontrado',
  );

  // 2. Config pública
  const cfg = await get('/public/bosque-magico/configuracion');
  ok('GET configuracion → 200', cfg.status === 200);
  const items = cfg.body ?? [];
  const map = new Map(items.map((i) => [i.clave, i.valor]));
  ok('Config cajitas_incluidas=10', map.get('paquetes.cajitas_incluidas') === 10);
  ok('Config piqueos_credito=200', map.get('paquetes.piqueos_credito_premium') === 200);
  ok('Config cajitas_excedente=20.9', map.get('paquetes.cajitas_precio_excedente') === 20.9);

  const shows = cat.body?.productos?.shows ?? [];
  const show1 = shows[0];
  const show2 = shows[1];
  const piq1 = piqueos.find((p) => p.codigo === 'PIQ-001') ?? piqueos[0];
  const piq2 = piqueos.find((p) => p.codigo === 'PIQ-002') ?? piqueos[1];
  const piq3 = piqueos.find((p) => p.codigo === 'PIQ-020') ?? piqueos[2];

  const fechaLv = '2026-07-08'; // martes
  const fechaFds = '2026-07-11'; // sábado

  // 3. Preview Básico L-V
  const prevBasico = await post('/public/bosque-magico/cotizaciones/preview', {
    fechaEvento: fechaLv,
    cantidadNinos: 25,
    paquete: 'Básico',
    seleccion: { cajitasCantidad: 10 },
  });
  ok('Preview Básico L-V → 200', prevBasico.status === 200 || prevBasico.status === 201);
  ok(
    'Preview Básico base=380',
    prevBasico.body?.montos?.base === 380,
    `base=${prevBasico.body?.montos?.base}`,
  );

  // 4. Preview Premium L-V base
  const prevPremium = await post('/public/bosque-magico/cotizaciones/preview', {
    fechaEvento: fechaLv,
    cantidadNinos: 25,
    paquete: 'Premium',
    seleccion: { cajitasCantidad: 10 },
  });
  ok(
    'Preview Premium base=580',
    prevPremium.body?.montos?.base === 580,
    `base=${prevPremium.body?.montos?.base}`,
  );

  // 5. Cajitas excedente
  const prevCajitas = await post('/public/bosque-magico/cotizaciones/preview', {
    fechaEvento: fechaLv,
    cantidadNinos: 25,
    paquete: 'Premium',
    seleccion: { cajitasCantidad: 15 },
  });
  const exCaj = prevCajitas.body?.resumenPaquete?.cajitasExcedente;
  ok('Cajitas 15 → excedente 5', exCaj === 5, `excedente=${exCaj}`);
  ok(
    'Monto items incluye 5×20.9',
    Math.abs((prevCajitas.body?.montos?.items ?? 0) - 5 * 20.9) < 0.01,
    `items=${prevCajitas.body?.montos?.items}`,
  );

  // 6. Piqueos crédito atómico (3 packs distintos)
  if (piq1 && piq2 && piq3) {
    const prevPiq = await post('/public/bosque-magico/cotizaciones/preview', {
      fechaEvento: fechaLv,
      cantidadNinos: 25,
      paquete: 'Premium',
      seleccion: {
        cajitasCantidad: 10,
        piqueos: [
          { productoId: piq1.id, cantidad: 1 },
          { productoId: piq2.id, cantidad: 1 },
          { productoId: piq3.id, cantidad: 1 },
        ],
      },
    });
    const exPiq = prevPiq.body?.resumenPaquete?.piqueosExcedente;
    ok(
      'Piqueos 3 packs → excedente atómico 62.5',
      Math.abs(exPiq - 62.5) < 0.01,
      `excedente=${exPiq}`,
    );
  } else {
    ok('Piqueos 3 packs (skip: IDs)', false, 'faltan productos piqueo');
  }

  // 7. Dos packs del mismo piqueo
  if (piq1) {
    const prev2packs = await post('/public/bosque-magico/cotizaciones/preview', {
      fechaEvento: fechaLv,
      cantidadNinos: 25,
      paquete: 'Premium',
      seleccion: {
        cajitasCantidad: 10,
        piqueos: [{ productoId: piq1.id, cantidad: 2 }],
      },
    });
    const itemsPiq = (prev2packs.body?.items ?? []).filter((i) =>
      i.nombre?.includes(piq1.nombre.split(' ')[0]),
    );
    ok(
      '2 packs mismo piqueo → 2 líneas incluidas',
      itemsPiq.filter((i) => i.origenItem === 'incluido_paquete').length === 2,
      `incluidas=${itemsPiq.filter((i) => i.origenItem === 'incluido_paquete').length}`,
    );
    ok(
      '2 packs mismo piqueo sin excedente (50+50≤200)',
      (prev2packs.body?.resumenPaquete?.piqueosExcedente ?? 0) === 0,
    );
  }

  // 8. Shows Estándar: 1 incluido, 2 cobrado
  if (show1 && show2) {
    const prevShows = await post('/public/bosque-magico/cotizaciones/preview', {
      fechaEvento: fechaLv,
      cantidadNinos: 25,
      paquete: 'Estándar',
      seleccion: {
        cajitasCantidad: 10,
        showIds: [show1.id, show2.id],
      },
    });
    ok('Preview Estándar base=480', prevShows.body?.montos?.base === 480);
    const showItems = (prevShows.body?.items ?? []).filter((i) => i.categoria === 'show');
    const incluido = showItems.find((i) => i.origenItem === 'incluido_paquete');
    const cobrado = showItems.find((i) => i.precioUnitario > 0);
    ok('Show 1 incluido en Estándar', Boolean(incluido));
    ok('Show 2 adicional cobrado', Boolean(cobrado));
  }

  // 9. Fin de semana Premium base 780
  const prevFds = await post('/public/bosque-magico/cotizaciones/preview', {
    fechaEvento: fechaFds,
    cantidadNinos: 25,
    paquete: 'Premium',
    seleccion: { cajitasCantidad: 10 },
  });
  ok(
    'Preview Premium FDS base=780',
    prevFds.body?.montos?.base === 780,
    `base=${prevFds.body?.montos?.base}`,
  );
  ok('Preview FDS flag', prevFds.body?.esFinSemana === true);

  // 10. Niños extra 26-35
  const prevExtraNinos = await post('/public/bosque-magico/cotizaciones/preview', {
    fechaEvento: fechaLv,
    cantidadNinos: 30,
    paquete: 'Básico',
    seleccion: { cajitasCantidad: 10 },
  });
  ok(
    'Niños extra 5×25',
    prevExtraNinos.body?.montos?.ninosExtra === 125,
    `extra=${prevExtraNinos.body?.montos?.ninosExtra}`,
  );

  const failed = results.filter((r) => !r.pass);
  console.log(`\n--- Resumen: ${results.length - failed.length}/${results.length} OK ---`);
  if (failed.length) {
    console.log('\nFallidos:');
    for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`);
    process.exit(1);
  }
  console.log('\nTodos los flujos pasaron.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
