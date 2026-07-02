#!/usr/bin/env node
/**
 * Flujo E2E manual / WhatsApp — solicitud panel → tomar → cotizar → realizado.
 *
 * Simula lead que entra por WhatsApp (etapa nueva), vendedor toma y cierra el ciclo.
 *
 * Uso: node scripts/test-flujo-e2e-manual.mjs
 */
import {
  api,
  loginAdmin,
  celularUnico,
  fechaFutura,
  CELULAR_QA,
  BASE,
  tddMarca,
} from './test-helpers.mjs';

const MARCA = tddMarca('E2E-MANUAL');
const suffix = Date.now().toString().slice(-6);
const fechaEvento = fechaFutura(21);
const celular = celularUnico();
const email = `e2e.manual.${suffix}@test.bosquemagico.local`;

const steps = [];

function step(num, title, result, accepted = [200, 201], extra = '') {
  const ok = accepted.includes(result.status);
  steps.push({ num, title, ok, status: result.status, extra });
  if (ok) {
    console.log(`✅ M${String(num).padStart(2, '0')} — ${title} (${result.status})${extra ? ` · ${extra}` : ''}`);
    return true;
  }
  console.error(`❌ M${String(num).padStart(2, '0')} — ${title} (${result.status})`);
  console.error(JSON.stringify(result.body, null, 2));
  return false;
}

async function main() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log(' Bosque Mágico — Flujo E2E manual (WhatsApp → realizado)');
  console.log('══════════════════════════════════════════════════════');
  console.log(`API:     ${BASE}`);
  console.log(`Fecha:   ${fechaEvento}`);
  console.log(`Cliente: ${email} / ${celular}`);
  console.log(`Marca:   ${MARCA}\n`);

  let n = 0;
  let token;
  let solicitudId;
  let cotizacionId;
  let eventoId;
  let contratoId;

  n++;
  if (!step(n, 'Health check', await api('/health'))) process.exit(1);

  n++;
  token = await loginAdmin();
  if (!step(n, 'Login panel admin', { status: token ? 200 : 401, body: {} })) process.exit(1);

  n++;
  const cat = await api('/public/bosque-magico/catalogo');
  if (!step(n, 'Catálogo público', cat)) process.exit(1);
  const showMagia = (cat.body?.productos?.shows ?? []).find((s) => s.codigo === 'SHOW-MAGIA');
  if (!showMagia) {
    console.error('SHOW-MAGIA no encontrado');
    process.exit(1);
  }

  n++;
  const preview = await api('/public/bosque-magico/cotizaciones/preview', {
    method: 'POST',
    body: {
      fechaEvento,
      cantidadNinos: 25,
      paquete: 'Estándar',
      seleccion: { cajitasCantidad: 10, showIds: [showMagia.id] },
    },
  });
  if (!step(n, 'Preview Estándar 25+show', preview, [200, 201])) process.exit(1);
  const extraPreview = preview.body?.montos?.ninosExtra;
  n++;
  if (
    !step(
      n,
      'Preview extra = 75',
      { status: Math.abs(Number(extraPreview) - 75) < 0.01 ? 200 : 400, body: preview.body },
      [200],
      `ninosExtra=${extraPreview}`,
    )
  )
    process.exit(1);

  n++;
  const sol = await api('/public/bosque-magico/solicitudes/whatsapp', {
    method: 'POST',
    body: {
      nombreContacto: `E2E Manual ${suffix}`,
      celular,
      correo: email,
      canal: 'whatsapp',
      detalleOrigen: 'whatsapp',
      fechaTentativa: fechaEvento,
      turnoInteres: 'turno_1',
      cantidadNinosEstimada: 25,
      notas: `${MARCA} lead WhatsApp (bot/n8n)`,
    },
  });
  solicitudId = sol.body?.id;
  if (!step(n, 'Crear solicitud WhatsApp (API pública)', sol, [200, 201], `id=${solicitudId}`)) process.exit(1);

  n++;
  const detNueva = await api(`/bosque-magico/solicitudes/${solicitudId}`, { token });
  if (
    !step(
      n,
      'Solicitud nueva sin borrador',
      detNueva,
      [200],
      `etapa=${detNueva.body?.etapa} canal=${detNueva.body?.canal}`,
    )
  )
    process.exit(1);
  if (detNueva.body?.etapa !== 'nueva') process.exit(1);
  if (detNueva.body?.canal !== 'whatsapp') process.exit(1);

  n++;
  if (!step(n, 'Tomar solicitud', await api(`/bosque-magico/solicitudes/${solicitudId}/tomar`, { method: 'POST', token })))
    process.exit(1);

  n++;
  const cot = await api('/bosque-magico/cotizaciones', {
    method: 'POST',
    token,
    body: {
      solicitudId,
      cliente: {
        nombreCompleto: `E2E Manual ${suffix}`,
        celular,
        correo: email,
      },
      cumpleanero: { nombre: 'Mateo', edad: 9 },
      fechaEvento,
      turno: 'turno_1',
      cantidadNinos: 25,
      paquete: 'Estándar',
      seleccion: {
        cajitasCantidad: 10,
        showIds: [showMagia.id],
      },
    },
  });
  cotizacionId = cot.body?.id;
  if (!step(n, 'Crear cotización con seleccion', cot, [200, 201], `id=${cotizacionId}`)) process.exit(1);

  n++;
  const detCot = await api(`/bosque-magico/cotizaciones/${cotizacionId}`, { token });
  const montoExtra = Number(detCot.body?.montoNinosExtra ?? 0);
  if (!step(n, 'Cotización montoNinosExtra=75', detCot, [200], `extra=${montoExtra}`)) process.exit(1);
  if (Math.abs(montoExtra - 75) >= 0.01) process.exit(1);

  n++;
  if (
    !step(
      n,
      'Enviar cotización (WhatsApp)',
      await api(`/bosque-magico/cotizaciones/${cotizacionId}/enviar`, {
        method: 'POST',
        token,
        body: { canal: 'whatsapp', celularDestino: CELULAR_QA },
      }),
      [200, 201],
    )
  )
    process.exit(1);

  n++;
  const aceptar = await api(`/bosque-magico/cotizaciones/${cotizacionId}/aceptar`, {
    method: 'POST',
    token,
  });
  eventoId = aceptar.body?.eventoId ?? aceptar.body?.evento?.id;
  if (!step(n, 'Aceptar cotización → evento', aceptar, [200, 201], `evento=${eventoId}`)) process.exit(1);
  if (!eventoId) process.exit(1);

  n++;
  const contrato = await api(`/bosque-magico/eventos/${eventoId}/contrato`, {
    method: 'POST',
    token,
    body: {
      numeroDocumento: '70998877',
      tipoComprobante: 'boleta',
      documentoTributario: '70998877',
      horarioInicio: '15:00',
      horarioFin: '18:00',
      adelanto1Monto: 400,
      adelanto1Fecha: fechaEvento,
    },
  });
  contratoId = contrato.body?.id;
  if (!step(n, 'Generar contrato', contrato, [200, 201], `id=${contratoId}`)) process.exit(1);

  n++;
  if (
    !step(
      n,
      'Enviar contrato',
      await api(`/bosque-magico/contratos/${contratoId}/enviar`, { method: 'POST', token }),
      [200, 201],
    )
  )
    process.exit(1);

  n++;
  const pedidosPre = await api(`/bosque-magico/eventos/${eventoId}/pedidos`, { token });
  const pedidosProv = (pedidosPre.body ?? []).filter((p) => p.tipo === 'proveedor');
  for (const p of pedidosProv) {
    await api(`/bosque-magico/pedidos/${p.id}`, {
      method: 'PATCH',
      token,
      body: { etapa: 'confirmado' },
    });
  }
  console.log(`✅ M${String(n).padStart(2, '0')} — Pedidos proveedor confirmados (${pedidosProv.length})`);
  steps.push({ num: n, title: 'Pedidos proveedor', ok: true, status: 200, extra: String(pedidosProv.length) });

  n++;
  if (
    !step(
      n,
      'Confirmar evento',
      await api(`/bosque-magico/eventos/${eventoId}/confirmar`, { method: 'POST', token }),
      [200, 201],
    )
  )
    process.exit(1);

  n++;
  const evtConf = await api(`/bosque-magico/eventos/${eventoId}`, { token });
  if (!step(n, 'Evento confirmado', evtConf, [200], `etapa=${evtConf.body?.etapa}`)) process.exit(1);

  n++;
  if (
    !step(
      n,
      'Realizar evento',
      await api(`/bosque-magico/eventos/${eventoId}/realizar`, { method: 'POST', token }),
      [200, 201],
    )
  )
    process.exit(1);

  n++;
  const evtFinal = await api(`/bosque-magico/eventos/${eventoId}`, { token });
  if (!step(n, 'Evento realizado', evtFinal, [200], `etapa=${evtFinal.body?.etapa}`)) process.exit(1);

  n++;
  const solFinal = await api(`/bosque-magico/solicitudes/${solicitudId}`, { token });
  if (
    !step(
      n,
      'Solicitud cerrada ganada',
      solFinal,
      [200],
      `etapa=${solFinal.body?.etapa} motivo=${solFinal.body?.motivoCierre ?? '—'}`,
    )
  )
    process.exit(1);

  const failed = steps.filter((s) => !s.ok);
  console.log('\n══════════════════════════════════════════════════════');
  console.log(` Resultado: ${steps.length - failed.length}/${steps.length} pasos OK`);
  console.log('══════════════════════════════════════════════════════');
  console.log(`  Solicitud:  ${solicitudId}`);
  console.log(`  Cotización: ${cotizacionId}`);
  console.log(`  Evento:     ${eventoId}\n`);

  if (failed.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
