#!/usr/bin/env node
/**
 * Casos negativos / variantes de robustez API.
 * Uso:
 *   QA_API_URL=http://localhost:3000/api \
 *   QA_EMAIL=admin@bosquemagico.test \
 *   QA_PASSWORD=admin@@@ \
 *   npm run qa:negativos
 */
const API = (process.env.QA_API_URL ?? 'http://localhost:3000/api').replace(/\/+$/, '');
const EMAIL = process.env.QA_EMAIL ?? 'admin@bosquemagico.test';
const PASS = process.env.QA_PASSWORD ?? 'BosqueDev123!';
const CELULAR = process.env.QA_CELULAR ?? '910139973';

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
  return { status: res.status, data };
}

function assertCase(id, desc, status, expected, data) {
  const ok = expected.includes(status);
  console.log(`${ok ? '✅' : '❌'} ${id}: ${desc} → ${status} (esperado ${expected.join('|')})`);
  if (!ok) {
    console.error(JSON.stringify({ status, data }, null, 2));
    process.exit(1);
  }
}

async function main() {
  console.log('\nBosque QA — casos negativos / variantes');
  console.log(`API: ${API}\n`);

  const neg01 = await call('/auth/login', {
    method: 'POST',
    body: { email: EMAIL, password: 'clave-invalida-qa' },
  });
  assertCase('NEG-01', 'Login inválido', neg01.status, [401]);

  const neg02 = await call('/public/bosque-magico/solicitudes', {
    method: 'POST',
    body: {},
  });
  assertCase('NEG-02', 'Solicitud pública vacía {}', neg02.status, [400]);

  const login = await call('/auth/login', {
    method: 'POST',
    body: { email: EMAIL, password: PASS },
  });
  if (![200, 201].includes(login.status) || !login.data?.accessToken) {
    console.error('❌ Login admin falló para casos autenticados');
    process.exit(1);
  }
  const token = login.data.accessToken;

  const suffix = Date.now().toString().slice(-6);
  const crear = await call('/bosque-magico/solicitudes', {
    method: 'POST',
    token,
    body: {
      nombreContacto: `NEG cerrar ${suffix}`,
      celular: CELULAR,
      correo: `neg.cerrar.${suffix}@example.test`,
      canal: 'whatsapp',
      etapaInicial: 'nueva',
    },
  });
  if (![200, 201].includes(crear.status) || !crear.data?.id) {
    console.error('❌ No se pudo crear solicitud para NEG-03/04');
    process.exit(1);
  }
  const solicitudId = crear.data.id;

  const neg03 = await call(`/bosque-magico/solicitudes/${solicitudId}/cerrar`, {
    method: 'POST',
    token,
    body: { motivoCierre: 'sin_respuesta', notas: 'NEG-03' },
  });
  assertCase('NEG-03', 'Cerrar solicitud nueva', neg03.status, [200, 201]);

  const neg04 = await call(`/bosque-magico/solicitudes/${solicitudId}/tomar`, {
    method: 'POST',
    token,
  });
  assertCase('NEG-04', 'Tomar solicitud ya cerrada', neg04.status, [400]);

  const neg05 = await call('/public/bosque-magico/contratos/token-invalido-qa-000');
  assertCase('NEG-05', 'Contrato público token inválido', neg05.status, [404]);

  console.log('\n✅ Casos negativos OK (5/5)\n');
}

main().catch((e) => {
  console.error('❌ Error inesperado:', e);
  process.exit(1);
});
