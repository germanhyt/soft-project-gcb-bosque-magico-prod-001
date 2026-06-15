#!/usr/bin/env node
/**
 * Smoke test operaciones: proveedores, pedidos, tareas (requiere API + seed demo).
 * Uso: node scripts/qa-operaciones-demo.mjs
 */
const API = process.env.API_URL ?? 'http://localhost:3000/api';
const EMAIL = process.env.ADMIN_EMAIL ?? 'admin@bosquemagico.test';
const PASS = process.env.ADMIN_PASSWORD ?? 'BosqueDev123!';

async function login() {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  if (!res.ok) throw new Error(`Login falló: ${res.status}`);
  const data = await res.json();
  return data.accessToken ?? data.access_token ?? data.token;
}

async function apiGet(path, token) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}: ${text}`);
  return JSON.parse(text);
}

function iso(d) {
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log('QA operaciones — API', API);
  const token = await login();
  console.log('✓ Login OK');

  const proveedores = await apiGet('/bosque-magico/proveedores', token);
  console.log(`✓ Proveedores: ${proveedores.length}`);
  const demoProv = proveedores.find((p) => p.nombre.includes('Show Magic'));
  if (!demoProv) throw new Error('Falta proveedor demo (ejecuta db:seed:demo)');

  const desde = iso(new Date());
  const hasta = iso(new Date(Date.now() + 30 * 86400000));
  const pedidos = await apiGet(
    `/bosque-magico/pedidos?desde=${desde}&hasta=${hasta}`,
    token,
  );
  console.log(`✓ Pedidos operaciones (${desde}…${hasta}): ${pedidos.length}`);
  if (pedidos.length === 0) throw new Error('Sin pedidos demo en rango');

  const eventoId = pedidos[0].evento?.id ?? pedidos[0].eventoId;
  const pedidosEvento = await apiGet(`/bosque-magico/eventos/${eventoId}/pedidos`, token);
  console.log(`✓ Pedidos evento ${eventoId}: ${pedidosEvento.length}`);

  const tareas = await apiGet(`/bosque-magico/eventos/${eventoId}/tareas`, token);
  console.log(`✓ Tareas checklist: ${tareas.length}`);
  if (tareas.length < 5) throw new Error('Checklist demo incompleto (esperado ≥5 tareas)');

  console.log('\n✅ QA operaciones OK');
  console.log(`   Panel: /operaciones y /agenda?detalle=${eventoId}`);
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
