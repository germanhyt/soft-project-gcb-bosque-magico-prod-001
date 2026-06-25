#!/usr/bin/env node

const DEFAULT_BASE_URL = 'http://localhost:3000/api';
const DEFAULT_EMAIL = 'admin@bosquemagico.test';
const DEFAULT_PASSWORD = 'BosqueDev123!';

const baseUrl = (process.env.QA_API_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
const email = process.env.QA_EMAIL || DEFAULT_EMAIL;
const password = process.env.QA_PASSWORD || DEFAULT_PASSWORD;

const nowIso = new Date().toISOString();
const futureIso = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
const suffix = Date.now().toString().slice(-6);

const mockSolicitudPublica = {
  cliente: {
    nombre: `QA Contacto ${suffix}`,
    celular: `9${Math.floor(10000000 + Math.random() * 89999999)}`,
    correo: `qa.${suffix}@example.test`,
  },
  cumpleanero: {
    nombre: 'QA Nino',
    edad: 7,
  },
  evento: {
    fechaTentativa: futureIso.slice(0, 10),
    turno: 'turno_2',
    cantidadNinos: 20,
    tematica: 'Superheroes',
    paquete: 'Premium',
  },
  observaciones: `Smoke test ${nowIso}`,
  preferencias: {
    extras: ['EXT-PINTA'],
    shows: ['SHOW-MAGIA'],
    catering: ['CAT-POPCORN'],
  },
};

const mockSolicitudManual = {
  nombreContacto: `QA Manual ${suffix}`,
  celular: `9${Math.floor(10000000 + Math.random() * 89999999)}`,
  correo: `qa.manual.${suffix}@example.test`,
  canal: 'manual',
  fechaTentativa: futureIso,
  turnoInteres: 'turno_1',
  cantidadNinosEstimada: 18,
  notas: `Creado por smoke test ${nowIso}`,
  etapaInicial: 'nueva',
};

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

function assertOk(step, result, acceptedStatuses = [200, 201]) {
  if (acceptedStatuses.includes(result.status)) {
    console.log(`✅ ${step} (${result.status})`);
    return;
  }
  console.error(`❌ ${step} (${result.status})`);
  console.error(JSON.stringify(result.data, null, 2));
  process.exit(1);
}

async function main() {
  console.log(`\nBosque QA Smoke`);
  console.log(`API: ${baseUrl}`);
  console.log(`Usuario: ${email}\n`);

  const health = await call('/health');
  assertOk('Health check', health);

  const authStatus = await call('/auth/status');
  assertOk('Auth status', authStatus);

  const login = await call('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  assertOk('Auth login', login, [200, 201]);

  const token = login.data?.accessToken;
  if (!token) {
    console.error('❌ Login no devolvio accessToken');
    process.exit(1);
  }

  const me = await call('/auth/me', { token });
  assertOk('Auth me', me);

  const cfgPublica = await call('/public/bosque-magico/configuracion');
  assertOk('Public configuracion', cfgPublica);

  const catalogo = await call('/public/bosque-magico/catalogo');
  assertOk('Public catalogo', catalogo);

  const crearSolicitudPublica = await call('/public/bosque-magico/solicitudes', {
    method: 'POST',
    body: mockSolicitudPublica,
  });
  assertOk('Crear solicitud publica (mock)', crearSolicitudPublica, [200, 201]);

  const crearSolicitudManualRes = await call('/bosque-magico/solicitudes', {
    method: 'POST',
    token,
    body: mockSolicitudManual,
  });
  assertOk('Crear solicitud manual (mock)', crearSolicitudManualRes, [200, 201]);

  const listSolicitudes = await call('/bosque-magico/solicitudes?page=1&pageSize=10', { token });
  assertOk('Listar solicitudes', listSolicitudes);

  const listCotizaciones = await call('/bosque-magico/cotizaciones?page=1&pageSize=10', { token });
  assertOk('Listar cotizaciones', listCotizaciones);

  const listEventos = await call('/bosque-magico/eventos?page=1&pageSize=10', { token });
  assertOk('Listar eventos', listEventos);

  const listClientes = await call('/bosque-magico/clientes?page=1&pageSize=10', { token });
  assertOk('Listar clientes', listClientes);

  const cfgPanel = await call('/bosque-magico/configuracion', { token });
  assertOk('Config panel (privado)', cfgPanel);

  const solicitudId = crearSolicitudManualRes.data?.id;
  if (!solicitudId) {
    console.error('❌ Crear solicitud manual no devolvio id');
    process.exit(1);
  }

  const tomar = await call(`/bosque-magico/solicitudes/${solicitudId}/tomar`, {
    method: 'POST',
    token,
  });
  assertOk('Tomar solicitud (flujo comercial)', tomar);

  const patchSolicitud = await call(`/bosque-magico/solicitudes/${solicitudId}`, {
    method: 'PATCH',
    token,
    body: {
      nombreContacto: mockSolicitudManual.nombreContacto,
      notas: `Actualizado por smoke ${suffix}`,
    },
  });
  assertOk('Editar solicitud (PATCH datos/seguimiento)', patchSolicitud);

  const crearCotizacion = await call('/bosque-magico/cotizaciones', {
    method: 'POST',
    token,
    body: {
      solicitudId,
      cliente: {
        nombreCompleto: mockSolicitudManual.nombreContacto,
        celular: mockSolicitudManual.celular,
        correo: mockSolicitudManual.correo,
      },
      cumpleanero: { nombre: 'QA Cumpleanero', edad: 8 },
      fechaEvento: futureIso.slice(0, 10),
      turno: 'turno_1',
      cantidadNinos: 20,
      paquete: 'Básico',
      items: [],
    },
  });
  assertOk('Crear cotizacion borrador desde solicitud', crearCotizacion, [200, 201]);

  const cotizacionId = crearCotizacion.data?.id;
  if (!cotizacionId) {
    console.error('❌ Crear cotizacion no devolvio id');
    process.exit(1);
  }

  const enviarCot = await call(`/bosque-magico/cotizaciones/${cotizacionId}/enviar`, {
    method: 'POST',
    token,
    body: { canal: 'whatsapp', celularDestino: mockSolicitudManual.celular },
  });
  assertOk('Enviar cotizacion (whatsapp)', enviarCot, [200, 201]);

  const aceptarCot = await call(`/bosque-magico/cotizaciones/${cotizacionId}/aceptar`, {
    method: 'POST',
    token,
  });
  assertOk('Aceptar cotizacion (panel)', aceptarCot, [200, 201]);

  const eventoId = aceptarCot.data?.eventoId;
  if (!eventoId) {
    console.error('❌ Aceptar cotizacion no devolvio eventoId');
    process.exit(1);
  }

  const fechaEvt = futureIso.slice(0, 10);
  const contrato = await call(`/bosque-magico/eventos/${eventoId}/contrato`, {
    method: 'POST',
    token,
    body: {
      numeroDocumento: '12345678',
      tipoComprobante: 'boleta',
      documentoTributario: '12345678',
      horarioInicio: '15:00',
      horarioFin: '18:00',
      adelanto1Monto: 300,
      adelanto1Fecha: fechaEvt,
    },
  });
  assertOk('Generar contrato', contrato, [200, 201]);

  const contratoId = contrato.data?.id;
  const enviarContrato = await call(`/bosque-magico/contratos/${contratoId}/enviar`, {
    method: 'POST',
    token,
  });
  assertOk('Enviar contrato', enviarContrato, [200, 201]);

  const pedidosEvt = await call(`/bosque-magico/eventos/${eventoId}/pedidos`, { token });
  for (const p of pedidosEvt.data ?? []) {
    if (p.tipo === 'proveedor') {
      await call(`/bosque-magico/pedidos/${p.id}`, {
        method: 'PATCH',
        token,
        body: { etapa: 'confirmado' },
      });
    }
  }

  const confirmarEvt = await call(`/bosque-magico/eventos/${eventoId}/confirmar`, {
    method: 'POST',
    token,
  });
  assertOk('Confirmar evento en agenda', confirmarEvt, [200, 201]);

  const realizarEvt = await call(`/bosque-magico/eventos/${eventoId}/realizar`, {
    method: 'POST',
    token,
  });
  assertOk('Marcar evento realizado', realizarEvt, [200, 201]);

  console.log('\n✅ Smoke test completado correctamente (incluye flujo E2E comercial).\n');
}

main().catch((err) => {
  console.error('❌ Error inesperado en smoke test');
  console.error(err);
  process.exit(1);
});
