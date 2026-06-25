#!/usr/bin/env node
/**
 * QA — Fases recientes (BOSQUE_COMMANDS 312-321)
 * F1 anticipación | F2 contrato+proveedor antes agenda | F3 adjuntos contrato
 * F4 media catálogo | F5 postventa | Config paquetes
 *
 * Uso: npm run qa:fases
 */
const API = (process.env.QA_API_URL ?? 'http://localhost:3000/api').replace(/\/+$/, '');
const EMAIL = process.env.QA_EMAIL ?? 'admin@bosquemagico.test';
const PASS = process.env.QA_PASSWORD ?? 'BosqueDev123!';
const CELULAR = process.env.QA_CELULAR ?? '910139973';

const resultados = [];
let token = '';

async function callJson(path, { method = 'GET', body } = {}) {
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
  return { status: res.status, ok: res.ok, data };
}

async function callMultipart(path, form) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { method: 'POST', headers, body: form });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, ok: res.ok, data };
}

function reg(id, titulo, status, expected, extra = {}) {
  const ok = expected.includes(status);
  resultados.push({ id, titulo, status, ok, ...extra });
  console.log(`${ok ? '✅' : '❌'} ${id}: ${titulo} → ${status} (esperado ${expected.join('|')})`);
  if (!ok) console.error(JSON.stringify(extra.detail ?? extra, null, 2));
  return ok;
}

function isoDatePlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log('\n═══════════════════════════════════════════');
  console.log(' QA Fases recientes — Bosque Mágico');
  console.log('═══════════════════════════════════════════');
  console.log(`API: ${API}\n`);

  // ── Pre-flight ──
  const login = await callJson('/auth/login', {
    method: 'POST',
    body: { email: EMAIL, password: PASS },
  });
  if (!reg('PF-01', 'Login admin', login.status, [200, 201])) {
    process.exit(1);
  }
  token = login.data.accessToken;

  const cfg = await callJson('/bosque-magico/configuracion');
  if (!reg('PF-02', 'GET configuración panel', cfg.status, [200])) process.exit(1);

  const claves = new Set((cfg.data?.todas ?? []).map((c) => c.clave));
  const requeridas = [
    'solicitud.min_dias_anticipacion',
    'postventa.habilitado',
    'postventa.url_formulario',
    'pedidos_proveedor.notificar_correo',
    'paquetes.cajitas_incluidas',
  ];
  const faltantes = requeridas.filter((k) => !claves.has(k));
  reg(
    'PF-03',
    'Claves de config presentes',
    faltantes.length === 0 ? 200 : 404,
    [200],
    { faltantes },
  );
  if (faltantes.length) {
    console.error('   Ejecuta: npm run db:seed -w @bosque/api');
    process.exit(1);
  }

  // ── F1 Anticipación ──
  console.log('\n── F1: Anticipación ──');

  const saveAnt = await callJson('/bosque-magico/configuracion', {
    method: 'PATCH',
    body: {
      actualizaciones: [{ clave: 'solicitud.min_dias_anticipacion', valor: 7 }],
    },
  });
  reg('F1-01', 'Guardar anticipación mínima', saveAnt.status, [200]);

  const savePaquetes = await callJson('/bosque-magico/configuracion', {
    method: 'PATCH',
    body: {
      actualizaciones: [
        { clave: 'tarifas.base_lunes_viernes', valor: 380 },
        { clave: 'paquetes.cajitas_incluidas', valor: 10 },
        { clave: 'paquetes.cajitas_precio_excedente', valor: 20.9 },
        { clave: 'paquetes.piqueos_credito_premium', valor: 200 },
      ],
    },
  });
  reg('F1-02', 'Guardar config con claves paquetes.*', savePaquetes.status, [200]);

  const previewBad = await callJson('/public/bosque-magico/cotizaciones/preview', {
    method: 'POST',
    body: {
      fechaEvento: isoDatePlus(2),
      cantidadNinos: 15,
      paquete: 'Básico',
    },
  });
  reg('F1-03', 'Preview cotización fecha < 7 días', previewBad.status, [400], {
    detail: previewBad.data,
  });

  const previewOk = await callJson('/public/bosque-magico/cotizaciones/preview', {
    method: 'POST',
    body: {
      fechaEvento: isoDatePlus(14),
      cantidadNinos: 15,
      paquete: 'Básico',
    },
  });
  reg('F1-04', 'Preview cotización fecha válida', previewOk.status, [200, 201]);

  const suffix = Date.now().toString().slice(-6);
  const solBad = await callJson('/public/bosque-magico/solicitudes', {
    method: 'POST',
    body: {
      cliente: { nombre: `QA Ant ${suffix}`, celular: CELULAR, correo: `qa.ant.bad.${suffix}@example.test` },
      evento: { fechaTentativa: isoDatePlus(1), turno: 'turno_1', cantidadNinos: 12, paquete: 'Básico' },
    },
  });
  reg('F1-05', 'Solicitud pública fecha inválida', solBad.status, [400], { detail: solBad.data });

  // ── F2 Flujo contrato + proveedor ──
  console.log('\n── F2: Contrato + proveedor antes de agenda ──');

  const catalogo = await callJson('/public/bosque-magico/catalogo');
  const show = (catalogo.data?.productos?.shows ?? []).find((p) => p.codigo === 'SHOW-MAGIA');
  const turnos = ['turno_1', 'turno_2', 'turno_3'];
  const turno = turnos[Number(suffix) % turnos.length];
  const fechaEvt = isoDatePlus(21 + (Number(suffix) % 7));

  const crearSol = await callJson('/bosque-magico/solicitudes', {
    method: 'POST',
    body: {
      nombreContacto: `QA Flujo ${suffix}`,
      celular: CELULAR,
      correo: `qa.flujo.${suffix}@example.test`,
      canal: 'manual',
      fechaTentativa: `${fechaEvt}T00:00:00.000Z`,
      turnoInteres: turno,
      cantidadNinosEstimada: 20,
      etapaInicial: 'nueva',
    },
  });
  const solicitudId = crearSol.data?.id;
  if (!reg('F2-01', 'Crear solicitud manual', crearSol.status, [200, 201], { solicitudId })) {
    process.exit(1);
  }

  await callJson(`/bosque-magico/solicitudes/${solicitudId}/tomar`, { method: 'POST' });

  const items = show
    ? [{ productoId: show.id, tipo: 'show', nombre: show.nombre, cantidad: 1, precioUnitario: 180 }]
    : [];

  const cot = await callJson('/bosque-magico/cotizaciones', {
    method: 'POST',
    body: {
      solicitudId,
      cliente: { nombreCompleto: `QA Flujo ${suffix}`, celular: CELULAR, correo: `qa.flujo.${suffix}@example.test` },
      cumpleanero: { nombre: 'Niño QA', edad: 8 },
      fechaEvento: fechaEvt,
      turno,
      cantidadNinos: 20,
      paquete: 'Básico',
      items,
    },
  });
  const cotizacionId = cot.data?.id;
  if (!reg('F2-02', 'Crear cotización', cot.status, [200, 201], {
    cotizacionId,
    detail: cot.data,
  })) process.exit(1);

  await callJson(`/bosque-magico/cotizaciones/${cotizacionId}/enviar`, {
    method: 'POST',
    body: { canal: 'whatsapp', celularDestino: CELULAR },
  });

  const aceptar = await callJson(`/bosque-magico/cotizaciones/${cotizacionId}/aceptar`, {
    method: 'POST',
  });
  const eventoId = aceptar.data?.eventoId;
  if (!reg('F2-03', 'Aceptar cotización → evento por_confirmar', aceptar.status, [200, 201], {
    eventoId,
    detail: aceptar.data,
  })) {
    process.exit(1);
  }

  const evt0 = await callJson(`/bosque-magico/eventos/${eventoId}`);
  reg(
    'F2-04',
    'Evento queda en por_confirmar',
    evt0.data?.etapa === 'por_confirmar' ? 200 : 409,
    [200],
    { etapa: evt0.data?.etapa },
  );

  const confirmSinContrato = await callJson(`/bosque-magico/eventos/${eventoId}/confirmar`, {
    method: 'POST',
  });
  reg('F2-05', 'Confirmar sin contrato → rechazo', confirmSinContrato.status, [400], {
    detail: confirmSinContrato.data,
  });

  const contrato = await callJson(`/bosque-magico/eventos/${eventoId}/contrato`, {
    method: 'POST',
    body: {
      numeroDocumento: '12345678',
      tipoComprobante: 'boleta',
      documentoTributario: '12345678',
      horarioInicio: '2:00 p.m.',
      horarioFin: '5:00 p.m.',
      adelanto1Monto: 300,
      adelanto1Fecha: fechaEvt,
    },
  });
  const contratoId = contrato.data?.id;
  if (!reg('F2-06', 'Generar contrato', contrato.status, [200, 201], {
    contratoId,
    detail: contrato.data,
  })) process.exit(1);

  const confirmSinEnviar = await callJson(`/bosque-magico/eventos/${eventoId}/confirmar`, {
    method: 'POST',
  });
  reg('F2-07', 'Confirmar con contrato borrador → rechazo', confirmSinEnviar.status, [400], {
    detail: confirmSinEnviar.data,
  });

  await callJson(`/bosque-magico/contratos/${contratoId}/enviar`, { method: 'POST' });

  const pedidos = await callJson(`/bosque-magico/eventos/${eventoId}/pedidos`);
  const pedidosProv = (pedidos.data ?? []).filter((p) => p.tipo === 'proveedor');
  for (const p of pedidosProv) {
    if (p.tokenPublico) {
      const pub = await callJson(`/public/bosque-magico/pedidos/${p.tokenPublico}`);
      reg('F2-07b', 'Ver pedido público proveedor', pub.status, [200], {
        puedeConfirmar: pub.data?.puedeConfirmar,
      });
      const confirmPed = await callJson(
        `/public/bosque-magico/pedidos/${p.tokenPublico}/confirmar`,
        { method: 'POST' },
      );
      reg('F2-07c', 'Proveedor confirma por enlace público', confirmPed.status, [200, 201]);
    } else {
      await callJson(`/bosque-magico/pedidos/${p.id}`, {
        method: 'PATCH',
        body: { etapa: 'confirmado' },
      });
    }
  }
  if (pedidosProv.length) {
    console.log(`   → ${pedidosProv.length} pedido(s) proveedor confirmados para F2-08`);
  }

  const confirmOk = await callJson(`/bosque-magico/eventos/${eventoId}/confirmar`, {
    method: 'POST',
  });
  reg('F2-08', 'Confirmar con contrato enviado (+ pedidos OK)', confirmOk.status, [200, 201], {
    etapa: confirmOk.data?.etapa,
  });

  const agenda = await callJson('/bosque-magico/eventos/agenda');
  const filas = agenda.data?.agenda ?? [];
  const enAgenda = filas.some((dia) =>
    (dia.eventos ?? []).some((e) => e.id === eventoId),
  );
  reg('F2-09', 'Evento confirmado visible en agenda', enAgenda ? 200 : 404, [200]);

  // ── F3 Adjuntos contrato ──
  console.log('\n── F3: Adjuntos contrato ──');

  const png1x1 = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );
  const formComprobante = new FormData();
  formComprobante.append(
    'archivo',
    new Blob([png1x1], { type: 'image/png' }),
    'comprobante-qa.png',
  );
  const adj1 = await callMultipart(
    `/bosque-magico/contratos/${contratoId}/adjuntos/comprobante_pago`,
    formComprobante,
  );
  reg('F3-01', 'Subir comprobante de pago', adj1.status, [200, 201]);

  const formConta = new FormData();
  formConta.append(
    'archivo',
    new Blob([png1x1], { type: 'image/png' }),
    'contabilidad-qa.png',
  );
  const adj2 = await callMultipart(
    `/bosque-magico/contratos/${contratoId}/adjuntos/documento_contabilidad`,
    formConta,
  );
  reg('F3-02', 'Subir documento contabilidad', adj2.status, [200, 201]);

  const contratoDet = await callJson(`/bosque-magico/contratos/${contratoId}`);
  const adjCount = contratoDet.data?.adjuntos?.length ?? 0;
  reg('F3-03', 'Contrato tiene adjuntos', adjCount >= 2 ? 200 : 404, [200], { adjCount });

  await callJson(`/bosque-magico/contratos/${contratoId}/adjuntos/comprobante_pago`, {
    method: 'DELETE',
  });
  const delAdj = await callJson(
    `/bosque-magico/contratos/${contratoId}/adjuntos/comprobante_pago`,
    { method: 'DELETE' },
  );
  reg('F3-04', 'Eliminar adjunto inexistente → 404', delAdj.status, [404]);

  // ── F4 Media catálogo ──
  console.log('\n── F4: Galería / video catálogo ──');

  const productos = await callJson('/bosque-magico/productos?soloActivos=true');
  const producto = (productos.data ?? []).find((p) => p.codigo === 'SHOW-MAGIA') ?? productos.data?.[0];
  if (!producto?.id) {
    console.error('❌ F4: No hay productos para probar media');
    process.exit(1);
  }

  const formImg = new FormData();
  formImg.append('imagen', new Blob([png1x1], { type: 'image/png' }), 'qa-show.png');
  const imgUp = await callMultipart(`/bosque-magico/productos/${producto.id}/imagen`, formImg);
  reg('F4-01', 'Subir imagen a galería', imgUp.status, [200, 201], {
    imagenes: imgUp.data?.imagenes?.length,
  });

  const videoUrl = await callJson(`/bosque-magico/productos/${producto.id}/video/url`, {
    method: 'POST',
    body: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  });
  reg('F4-02', 'Guardar URL de video', videoUrl.status, [200, 201]);

  const catalogo2 = await callJson('/public/bosque-magico/catalogo');
  const showPub = (catalogo2.data?.productos?.shows ?? []).find((p) => p.id === producto.id);
  reg(
    'F4-03',
    'Catálogo público expone imagenes/videoUrl',
    showPub?.imagenes?.length && showPub?.videoUrl ? 200 : 404,
    [200],
    { imagenes: showPub?.imagenes?.length, videoUrl: !!showPub?.videoUrl },
  );

  // ── F5 Postventa ──
  console.log('\n── F5: Postventa ──');

  const savePostventa = await callJson('/bosque-magico/configuracion', {
    method: 'PATCH',
    body: {
      actualizaciones: [
        { clave: 'postventa.habilitado', valor: false },
        { clave: 'postventa.url_formulario', valor: 'https://forms.example.test/qa' },
        { clave: 'postventa.asunto', valor: 'QA {{cliente}}' },
        {
          clave: 'postventa.cuerpo',
          valor: 'Hola {{cliente}}, completa: {{url}} evento {{evento}} fecha {{fecha}}',
        },
      ],
    },
  });
  reg('F5-01', 'Guardar config postventa', savePostventa.status, [200]);

  const realizarOff = await callJson(`/bosque-magico/eventos/${eventoId}/realizar`, {
    method: 'POST',
  });
  reg('F5-02', 'Realizar evento (postventa off)', realizarOff.status, [200, 201], {
    etapa: realizarOff.data?.etapa,
  });

  const audit = await callJson(
    `/bosque-magico/auditoria?tipoEntidad=evento&entidadId=${eventoId}`,
  );
  const acciones = (audit.data ?? []).map((a) => a.accion);
  const tieneRealizar = acciones.includes('realizar');
  reg('F5-03', 'Auditoría registra realizar', tieneRealizar ? 200 : 404, [200], { acciones });

  // ── Resumen ──
  const ok = resultados.filter((r) => r.ok).length;
  const fail = resultados.filter((r) => !r.ok).length;
  console.log('\n═══════════════════════════════════════════');
  console.log(` Resultado: ${ok} OK / ${fail} FAIL / ${resultados.length} total`);
  console.log('═══════════════════════════════════════════\n');

  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error('❌ Error inesperado:', e);
  process.exit(1);
});
