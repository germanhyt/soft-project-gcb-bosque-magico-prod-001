#!/usr/bin/env node
/**
 * QA — cambios recientes (extras cobrables, auto-tomar 526, recordatorios).
 * Uso:
 *   QA_PASSWORD=admin@@@ node scripts/qa-cambios-recientes.mjs
 */
import {
  BASE,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  celularUnico,
  fechaLaboralFutura,
  loginAdmin,
  api,
} from './test-helpers.mjs';

const resultados = [];

function reg(id, titulo, ok, detail) {
  resultados.push({ id, titulo, ok, detail });
  console.log(`${ok ? '✅' : '❌'} ${id}: ${titulo}`);
  if (!ok && detail) {
    console.error(typeof detail === 'string' ? detail : JSON.stringify(detail, null, 2));
  }
  return ok;
}

async function main() {
  console.log('\n═══════════════════════════════════════════');
  console.log(' QA cambios recientes — Bosque Mágico');
  console.log('═══════════════════════════════════════════');
  console.log(`API: ${BASE}`);
  console.log(`User: ${ADMIN_EMAIL}\n`);

  const token = await loginAdmin();
  if (!token) {
    reg('PF-01', 'Login admin', false, 'sin token — revisar QA_PASSWORD');
    process.exit(1);
  }
  reg('PF-01', 'Login admin', true);

  // ── Config: extras + recordatorios ──
  const cfg = await api('/bosque-magico/configuracion', { token });
  const itemsCfg = Array.isArray(cfg.body?.todas)
    ? cfg.body.todas
    : Array.isArray(cfg.body)
      ? cfg.body
      : [
          ...(cfg.body?.numericas ?? []),
          ...(cfg.body?.recordatorios ?? []),
          ...(cfg.body?.otras ?? []),
        ];
  const keys = new Set(itemsCfg.map((i) => i.clave));
  const needCfg = [
    'extras.salita_lounge',
    'extras.ingreso_show_externo',
    'extras.ingreso_decoracion_externo',
    'extras.ingreso_carrito_snack_externo',
    'recordatorios.habilitado',
    'recordatorios.dias_antes',
  ];
  const missing = needCfg.filter((k) => !keys.has(k));
  reg('CFG-01', 'Claves extras/recordatorios en config', missing.length === 0, {
    missing,
    sampleKeys: [...keys].filter((k) => k.startsWith('extras.') || k.startsWith('recordatorios.')),
  });

  // ── Preview cotización con extras cobrables ──
  const fecha = fechaLaboralFutura(21);
  const preview = await api('/public/bosque-magico/cotizaciones/preview', {
    method: 'POST',
    body: {
      paquete: 'Básico',
      fechaEvento: fecha,
      cantidadNinos: 15,
      seleccion: {
        salitaLoungeCantidad: 1,
        derechoIngresoShowExterno: true,
        derechoIngresoDecoracionExterno: true,
        derechoIngresoCarritoSnackExterno: true,
      },
    },
  });
  const items = preview.body?.items ?? [];
  const nombres = items.map((i) => String(i.nombre ?? ''));
  const tieneLounge = nombres.some((n) => /salita lounge/i.test(n));
  const tieneShow = nombres.some((n) => /show externo/i.test(n));
  const tieneDecor = nombres.some((n) => /decoraci[oó]n externo/i.test(n));
  const tieneCarrito = nombres.some((n) => /carrito snack externo/i.test(n));
  reg(
    'EXT-01',
    'Preview incluye extras cobrables (lounge+ingresos)',
    preview.ok && tieneLounge && tieneShow && tieneDecor && tieneCarrito,
    { status: preview.status, nombres, total: preview.body?.montos?.total },
  );

  // ── Solicitud nueva + crear cotización → auto-tomar (526) ──
  const cel = celularUnico();
  const sol = await api('/bosque-magico/solicitudes', {
    method: 'POST',
    token,
    body: {
      nombreContacto: `QA AutoTomar ${cel.slice(-4)}`,
      celular: cel,
      correo: `qa.autotomar.${cel}@bosquemagico.test`,
      fechaTentativa: fecha,
      turnoInteres: 'turno_1',
      cantidadNinosEstimada: 12,
      canal: 'manual',
      notas: 'QA-526 auto-tomar',
      etapaInicial: 'nueva',
    },
  });
  const solicitudId = sol.body?.id;
  reg('S26-01', 'Crear solicitud nueva', sol.ok && !!solicitudId, {
    status: sol.status,
    body: sol.body,
  });

  let solDetalle = await api(`/bosque-magico/solicitudes/${solicitudId}`, { token });
  const sinAsignar =
    !solDetalle.body?.usuarioAsignadoId && solDetalle.body?.etapa === 'nueva';
  reg('S26-02', 'Solicitud sin assignee (etapa nueva)', !!solicitudId && sinAsignar, {
    usuarioAsignadoId: solDetalle.body?.usuarioAsignadoId,
    etapa: solDetalle.body?.etapa,
  });

  const cot = await api('/bosque-magico/cotizaciones', {
    method: 'POST',
    token,
    body: {
      solicitudId,
      cliente: {
        nombreCompleto: `QA AutoTomar ${cel.slice(-4)}`,
        celular: cel,
        correo: `qa.autotomar.${cel}@bosquemagico.test`,
      },
      cumpleanero: { nombre: 'QA Niño', edad: 7 },
      fechaEvento: fecha,
      turno: 'turno_1',
      cantidadNinos: 12,
      paquete: 'Básico',
      seleccion: {
        salitaLoungeCantidad: 1,
        derechoIngresoShowExterno: true,
      },
    },
  });
  const cotizacionId = cot.body?.id;
  reg('S26-03', 'Crear cotización desde solicitud', cot.ok && !!cotizacionId, {
    status: cot.status,
    body: cot.body,
  });

  solDetalle = await api(`/bosque-magico/solicitudes/${solicitudId}`, { token });
  const tomada =
    !!solDetalle.body?.usuarioAsignadoId &&
    (solDetalle.body?.etapa === 'en_atencion' || solDetalle.body?.etapa === 'cotizada');
  reg('S26-04', 'Auto-tomar al crear cotización (526)', tomada, {
    usuarioAsignadoId: solDetalle.body?.usuarioAsignadoId,
    etapa: solDetalle.body?.etapa,
  });

  const cotItems = cot.body?.items ?? [];
  const cotNombres = cotItems.map((i) => String(i.nombre ?? ''));
  reg(
    'EXT-02',
    'Cotización panel persiste lounge + ingreso show',
    cotNombres.some((n) => /salita lounge/i.test(n)) &&
      cotNombres.some((n) => /show externo/i.test(n)),
    cotNombres,
  );

  // ── Job recordatorios (admin) ──
  const job = await api('/bosque-magico/jobs/recordatorios-eventos', {
    method: 'POST',
    token,
  });
  reg('REC-01', 'POST jobs/recordatorios-eventos responde OK', job.ok, {
    status: job.status,
    body: job.body,
  });

  // ── Pedidos listables (agrupación 527 es UI) ──
  const pedidos = await api('/bosque-magico/pedidos?page=1&pageSize=5', { token });
  reg('PED-01', 'Listar pedidos (base agrupación 527)', pedidos.ok, {
    status: pedidos.status,
  });

  console.log('\n── Resumen ──');
  const ok = resultados.filter((r) => r.ok).length;
  const fail = resultados.filter((r) => !r.ok).length;
  console.log(`OK: ${ok}  FAIL: ${fail}  Total: ${resultados.length}`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
