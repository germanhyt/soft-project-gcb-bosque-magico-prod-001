/**
 * Integración — preview (sin persistir) + E2E registros reales (TDD 2026-07-01).
 * Uso: node scripts/test-flujos-paquetes.mjs
 * Requiere API en http://localhost:3000 con seed aplicado.
 */
import { api, loginAdmin, celularUnico, BASE } from './test-helpers.mjs';

const TDD_MARCA = 'TDD-2026-07-01';
const results = [];

function ok(name, cond, detail = '') {
  results.push({ name, pass: Boolean(cond), detail });
  const icon = cond ? '✓' : '✗';
  console.log(`${icon} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function get(path) {
  const r = await api(path);
  return { status: r.status, body: r.body };
}

async function post(path, payload) {
  const r = await api(path, { method: 'POST', body: payload });
  return { status: r.status, body: r.body };
}

async function postAuth(path, payload, token) {
  const r = await api(path, { method: 'POST', token, body: payload });
  return { status: r.status, body: r.body };
}

async function getAuth(path, token) {
  const r = await api(path, { token });
  return { status: r.status, body: r.body };
}

async function loginPanel() {
  return loginAdmin();
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
    basico?.precioLunesViernes === 799 &&
      estandar?.precioLunesViernes === 1310 &&
      premium?.precioLunesViernes === 1770,
    `Básico=${basico?.precioLunesViernes} Estándar=${estandar?.precioLunesViernes} Premium=${premium?.precioLunesViernes}`,
  );

  const piqueos = cat.body?.productos?.piqueos ?? [];
  const snacks = cat.body?.productos?.snacks ?? [];
  const catering = cat.body?.productos?.catering ?? [];
  const snackPop = snacks.find((s) => s.codigo === 'CAT-POPCORN') ?? snacks[0];
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
  ok('Config maximo_base=20', map.get('ninos.maximo_base') === 20);
  ok('Config maximo_permitido=30', map.get('ninos.maximo_permitido') === 30);
  ok('Config show extra=15', map.get('shows.precio_nino_extra') === 15);
  ok('Config shows.ninos_incluidos=20', map.get('shows.ninos_incluidos') === 20);
  ok('Config extras extra=10', map.get('extras.precio_nino_extra') === 10);
  ok(
    'Config sin clave obsoleta tarifas.precio_nino_extra',
    !map.has('tarifas.precio_nino_extra'),
  );

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
    'Preview Básico base=799',
    prevBasico.body?.montos?.base === 799,
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
    'Preview Premium base=1770',
    prevPremium.body?.montos?.base === 1770,
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
    ok('Preview Estándar base=1310', prevShows.body?.montos?.base === 1310);
    const showItems = (prevShows.body?.items ?? []).filter((i) => i.categoria === 'show');
    const incluido = showItems.find((i) => i.origenItem === 'incluido_paquete');
    const cobrado = showItems.find((i) => i.precioUnitario > 0);
    ok('Show 1 incluido en Estándar', Boolean(incluido));
    ok('Show 2 adicional cobrado', Boolean(cobrado));
  }

  // 9. Fin de semana Premium base 2100
  const prevFds = await post('/public/bosque-magico/cotizaciones/preview', {
    fechaEvento: fechaFds,
    cantidadNinos: 25,
    paquete: 'Premium',
    seleccion: { cajitasCantidad: 10 },
  });
  ok(
    'Preview Premium FDS base=2100',
    prevFds.body?.montos?.base === 2100,
    `base=${prevFds.body?.montos?.base}`,
  );
  ok('Preview FDS flag', prevFds.body?.esFinSemana === true);

  // 10. Capacidad — Básico sin show no cobra extra; Estándar con show sí (21–30)
  const prevExtraNinos = await post('/public/bosque-magico/cotizaciones/preview', {
    fechaEvento: fechaLv,
    cantidadNinos: 30,
    paquete: 'Básico',
    seleccion: { cajitasCantidad: 10 },
  });
  ok(
    'Básico 30 niños sin show → sin extra capacidad',
    prevExtraNinos.body?.montos?.ninosExtra === 0,
    `extra=${prevExtraNinos.body?.montos?.ninosExtra}`,
  );

  const showMagia = shows.find((p) => p.codigo === 'SHOW-MAGIA');
  if (showMagia) {
    const prevShowExtra = await post('/public/bosque-magico/cotizaciones/preview', {
      fechaEvento: fechaLv,
      cantidadNinos: 25,
      paquete: 'Estándar',
      seleccion: { cajitasCantidad: 10, showIds: [showMagia.id] },
    });
    ok(
      'Estándar 25 niños + show → extra 5×15',
      prevShowExtra.body?.montos?.ninosExtra === 75,
      `extra=${prevShowExtra.body?.montos?.ninosExtra}`,
    );

    const prevShow30 = await post('/public/bosque-magico/cotizaciones/preview', {
      fechaEvento: fechaLv,
      cantidadNinos: 30,
      paquete: 'Estándar',
      seleccion: { cajitasCantidad: 10, showIds: [showMagia.id] },
    });
    ok(
      'Estándar 30 niños + show → extra 10×15',
      prevShow30.body?.montos?.ninosExtra === 150,
      `extra=${prevShow30.body?.montos?.ninosExtra}`,
    );
  } else {
    ok('Show extra capacidad (skip: sin SHOW-MAGIA)', false);
  }

  // 10b. Tope 30 niños — rechaza 31 en preview
  const prev31 = await post('/public/bosque-magico/cotizaciones/preview', {
    fechaEvento: fechaLv,
    cantidadNinos: 31,
    paquete: 'Básico',
    seleccion: { cajitasCantidad: 10 },
  });
  ok('API rechaza más de 30 niños', prev31.status === 400, `status=${prev31.status}`);

  // 11. Tarifas fin de semana por paquete
  const prevBasicoFds = await post('/public/bosque-magico/cotizaciones/preview', {
    fechaEvento: fechaFds,
    cantidadNinos: 25,
    paquete: 'Básico',
    seleccion: { cajitasCantidad: 10 },
  });
  ok('Preview Básico FDS base=950', prevBasicoFds.body?.montos?.base === 950);

  const prevEstandarFds = await post('/public/bosque-magico/cotizaciones/preview', {
    fechaEvento: fechaFds,
    cantidadNinos: 25,
    paquete: 'Estándar',
    seleccion: { cajitasCantidad: 10 },
  });
  ok('Preview Estándar FDS base=1650', prevEstandarFds.body?.montos?.base === 1650);

  // 12. Snack Premium — 25 incluidas, excedente S/10/u
  if (snackPop) {
    const prevSnack25 = await post('/public/bosque-magico/cotizaciones/preview', {
      fechaEvento: fechaLv,
      cantidadNinos: 25,
      paquete: 'Premium',
      seleccion: { cajitasCantidad: 10, snackId: snackPop.id, snackCantidad: 25 },
    });
    ok(
      'Snack 25 uds sin excedente',
      (prevSnack25.body?.resumenPaquete?.snackUnidadesExcedente ?? 0) === 0,
    );
    const snackIncl = (prevSnack25.body?.items ?? []).find(
      (i) => i.productoId === snackPop.id && i.origenItem === 'incluido_paquete',
    );
    ok(
      'Snack pack valorizado S/350',
      Math.abs((snackIncl?.precioCatalogo ?? 0) - 350) < 0.01,
      snackIncl ? `precioCatalogo=${snackIncl.precioCatalogo}` : 'sin item',
    );

    const prevSnack30 = await post('/public/bosque-magico/cotizaciones/preview', {
      fechaEvento: fechaLv,
      cantidadNinos: 25,
      paquete: 'Premium',
      seleccion: { cajitasCantidad: 10, snackId: snackPop.id, snackCantidad: 30 },
    });
    ok(
      'Snack 30 uds → excedente 5×10',
      (prevSnack30.body?.resumenPaquete?.snackUnidadesExcedente ?? 0) === 5 &&
        Math.abs((prevSnack30.body?.resumenPaquete?.snackMontoExcedente ?? 0) - 50) < 0.01,
      `unidades=${prevSnack30.body?.resumenPaquete?.snackUnidadesExcedente}`,
    );
  } else {
    ok('Snack Premium (skip: sin snacks catálogo)', false);
  }

  // 13. Catering adicional ≠ carrito snack (popcorn catering por porción)
  const cateringPop = catering.find((c) => c.codigo === 'CAT-POPCORN-CAT');
  if (cateringPop && snackPop) {
    const prevCat = await post('/public/bosque-magico/cotizaciones/preview', {
      fechaEvento: fechaLv,
      cantidadNinos: 25,
      paquete: 'Premium',
      seleccion: {
        cajitasCantidad: 10,
        snackId: snackPop.id,
        snackCantidad: 25,
        adicionales: [{ productoId: cateringPop.id, cantidad: 18 }],
      },
    });
    const snackItems = (prevCat.body?.items ?? []).filter((i) => i.productoId === snackPop.id);
    const catItems = (prevCat.body?.items ?? []).filter((i) => i.productoId === cateringPop.id);
    ok(
      'Premium: snack carrito + catering popcorn coexisten',
      snackItems.length >= 1 && catItems.length === 1,
      `snack=${snackItems.length} catering=${catItems.length}`,
    );
    ok(
      'Catering popcorn cobrado (no incluido)',
      catItems[0]?.precioUnitario > 0 && catItems[0]?.origenItem !== 'incluido_paquete',
    );
    ok(
      'Catering popcorn S/10 × 18 = 180',
      Math.abs((catItems[0]?.precioUnitario ?? 0) - 10) < 0.01 &&
        Math.abs((prevCat.body?.montos?.items ?? 0) - 180) < 0.01,
      `unit=${catItems[0]?.precioUnitario} items=${prevCat.body?.montos?.items}`,
    );
  }

  ok(
    'Catálogo catering incluye Manzanas y Mazamorra',
    catering.some((c) => c.codigo === 'CAT-MANZANAS') &&
      catering.some((c) => c.codigo === 'CAT-MAZAMORRA'),
  );
  if (cateringPop) {
    ok('Catering popcorn precio unitario=10', cateringPop.precioLunesViernes === 10);

    const prevCateringMin = await post('/public/bosque-magico/cotizaciones/preview', {
      fechaEvento: fechaLv,
      cantidadNinos: 20,
      paquete: 'Básico',
      seleccion: {
        cajitasCantidad: 10,
        adicionales: [{ productoId: cateringPop.id, cantidad: 10 }],
      },
    });
    ok(
      'API rechaza catering bajo mínimo (10 < 18)',
      prevCateringMin.status === 400,
      `status=${prevCateringMin.status}`,
    );
  }

  // 14. Básico: 1 extra incluido + 2º extra cobrado (simula stepper carrito)
  const extras = cat.body?.productos?.extras ?? [];
  const extra1 = extras[0];
  const extra2 = extras[1];
  if (extra1 && extra2) {
    const prevExtrasBasico = await post('/public/bosque-magico/cotizaciones/preview', {
      fechaEvento: fechaLv,
      cantidadNinos: 25,
      paquete: 'Básico',
      seleccion: {
        cajitasCantidad: 10,
        extraIds: [extra1.id, extra1.id, extra2.id],
      },
    });
    const extraItems = (prevExtrasBasico.body?.items ?? []).filter((i) => i.categoria === 'extra');
    ok(
      'Básico: 2 extras mismo producto → 1 incluido + 1 cobrado',
      extraItems.filter((i) => i.productoId === extra1.id && i.origenItem === 'incluido_paquete')
        .length === 1 &&
        extraItems.filter((i) => i.productoId === extra1.id && i.precioUnitario > 0).length === 1,
    );
  }

  // 14b. Extra Grupo B — uñitas con 25 niños → 5×10
  const extUnitas = extras.find((e) => e.codigo === 'EXT-UNITAS');
  if (extUnitas) {
    const prevUnitas = await post('/public/bosque-magico/cotizaciones/preview', {
      fechaEvento: fechaLv,
      cantidadNinos: 25,
      paquete: 'Básico',
      seleccion: { cajitasCantidad: 10, extraIds: [extUnitas.id] },
    });
    ok(
      'Uñitas 25 niños → extra capacidad 5×10',
      prevUnitas.body?.montos?.ninosExtra === 50,
      `extra=${prevUnitas.body?.montos?.ninosExtra}`,
    );
  } else {
    ok('Uñitas extra capacidad (skip: sin EXT-UNITAS)', false);
  }

  // 15. Estándar: mismo show ×2 → 1 incluido + 1 cobrado (stepper carrito)
  if (show1) {
    const prevShowDup = await post('/public/bosque-magico/cotizaciones/preview', {
      fechaEvento: fechaLv,
      cantidadNinos: 25,
      paquete: 'Estándar',
      seleccion: {
        cajitasCantidad: 10,
        showIds: [show1.id, show1.id],
      },
    });
    const showDupItems = (prevShowDup.body?.items ?? []).filter(
      (i) => i.productoId === show1.id && i.categoria === 'show',
    );
    ok(
      'Estándar: show ×2 → incluido + adicional',
      showDupItems.some((i) => i.origenItem === 'incluido_paquete') &&
        showDupItems.some((i) => i.precioUnitario > 0),
      `items=${showDupItems.length}`,
    );
  }

  // 16. E2E — registros reales en BD (visibles en panel Solicitudes)
  console.log('\n--- E2E registros (persisten en BD) ---');
  const showMagiaE2e = shows.find((p) => p.codigo === 'SHOW-MAGIA') ?? show1;
  const registrosCreados = [];

  if (showMagiaE2e) {
    const celLanding = celularUnico();
    const solLanding = await post('/public/bosque-magico/solicitudes', {
      cliente: {
        nombre: 'Test TDD Capacidad Show',
        celular: celLanding,
        correo: `tdd.capacidad.${Date.now()}@test.com`,
      },
      cumpleanero: { nombre: 'Mateo', edad: 7 },
      evento: {
        fechaTentativa: fechaLv,
        turno: 'turno_2',
        cantidadNinos: 25,
        paquete: 'Estándar',
        tematica: 'Dinosaurios',
      },
      preferencias: {
        origen: 'landing_cotizador',
        seleccion: {
          paquete: 'Estándar',
          cajitasCantidad: 10,
          showIds: [showMagiaE2e.id],
        },
      },
      observaciones: `${TDD_MARCA} Estándar 25 niños + show → extra 5×15 (E2E landing)`,
    });
    ok(
      'E2E solicitud landing → 200/201',
      solLanding.status === 200 || solLanding.status === 201,
      `status=${solLanding.status} id=${solLanding.body?.id ?? '?'}`,
    );
    const solLandingId = solLanding.body?.id;
    const cotId = solLanding.body?.cotizacion?.id;
    ok(
      'E2E borrador auto creado',
      Boolean(cotId && solLanding.body?.cotizacion?.codigo),
      solLanding.body?.cotizacion?.codigo ?? 'sin borrador',
    );

    const token = await loginPanel();
    if (token && cotId) {
      const cotDet = await getAuth(`/bosque-magico/cotizaciones/${cotId}`, token);
      const montoExtra = Number(cotDet.body?.montoNinosExtra ?? 0);
      ok(
        'E2E borrador montoNinosExtra=75 (5×15)',
        cotDet.status === 200 && Math.abs(montoExtra - 75) < 0.01,
        `montoNinosExtra=${montoExtra}`,
      );
    } else {
      ok('E2E verificar borrador en panel (skip: sin login/cotización)', false);
    }

    registrosCreados.push({
      tipo: 'landing+borrador',
      solicitudId: solLandingId,
      cotizacion: solLanding.body?.cotizacion?.codigo,
      buscar: 'Test TDD Capacidad',
    });
  } else {
    ok('E2E solicitud landing (skip: sin show)', false);
  }

  const celInsta = celularUnico();
  const solInsta = await post('/public/bosque-magico/solicitudes', {
    cliente: {
      nombre: 'Lead TDD Instagram',
      celular: celInsta,
      correo: `tdd.insta.${Date.now()}@test.com`,
    },
    evento: {
      fechaTentativa: fechaLv,
      turno: 'turno_1',
      cantidadNinos: 20,
    },
    origen: { detalle: 'instagram' },
    observaciones: `${TDD_MARCA} lead canal instagram (E2E WhatsApp/n8n)`,
  });
  ok(
    'E2E solicitud instagram → 200/201',
    solInsta.status === 200 || solInsta.status === 201,
    `status=${solInsta.status}`,
  );
  const solInstaId = solInsta.body?.id;
  const tokenDet = await loginPanel();
  if (tokenDet && solInstaId) {
    const detInsta = await getAuth(`/bosque-magico/solicitudes/${solInstaId}`, tokenDet);
    ok(
      'E2E canal meta + detalle instagram',
      detInsta.body?.canal === 'meta' && detInsta.body?.detalleOrigen === 'instagram',
      `canal=${detInsta.body?.canal} detalle=${detInsta.body?.detalleOrigen}`,
    );
  } else {
    ok('E2E canal instagram (skip: sin login/id)', false);
  }
  ok(
    'E2E instagram sin borrador auto',
    !solInsta.body?.cotizacion?.id,
    solInsta.body?.cotizacion ? 'tenía borrador' : 'ok',
  );
  registrosCreados.push({
    tipo: 'instagram',
    solicitudId: solInstaId,
    buscar: 'Lead TDD Instagram',
  });

  const tokenList = await loginPanel();
  if (tokenList) {
    const list = await getAuth(
      `/bosque-magico/solicitudes?q=${encodeURIComponent('Test TDD')}&pageSize=20`,
      tokenList,
    );
    const items = list.body?.items ?? list.body?.data ?? list.body ?? [];
    const encontradas = Array.isArray(items) ? items.length : 0;
    ok(
      'E2E listado panel encuentra solicitudes TDD (por nombre)',
      list.status === 200 && encontradas >= 1,
      `count=${encontradas}`,
    );
  }

  if (registrosCreados.length) {
    console.log('\n  Registros creados (Panel → Solicitudes):');
    for (const r of registrosCreados) {
      console.log(
        `    · ${r.tipo}: solicitud ${r.solicitudId ?? '?'}${r.cotizacion ? `, cot ${r.cotizacion}` : ''} — buscar "${r.buscar}"`,
      );
    }
    console.log(`    (observaciones incluyen marca ${TDD_MARCA})`);
  }

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
