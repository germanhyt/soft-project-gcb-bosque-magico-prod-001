/**
 * Utilidades compartidas para scripts QA / TDD (fetch + retry ante 429).
 */
export const BASE = (
  process.env.QA_API_URL ||
  process.env.API_URL ||
  'http://localhost:3000/api'
).replace(/\/+$/, '');

export const ADMIN_EMAIL =
  process.env.QA_EMAIL || process.env.ADMIN_EMAIL || 'admin@bosquemagico.test';
export const ADMIN_PASSWORD =
  process.env.QA_PASSWORD || process.env.ADMIN_PASSWORD || 'BosqueDev123!';
export const CELULAR_QA = process.env.QA_CELULAR || '910139973';

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Espera a que se reinicie la ventana del throttler (100 req/min). */
export async function cooldownThrottler(segundos = 62) {
  console.log(`\n⏸  Cooldown throttler API — ${segundos}s…\n`);
  await sleep(segundos * 1000);
}

export function celularUnico() {
  return `9${String(Date.now()).slice(-8)}`;
}

export function fechaFutura(dias = 14) {
  return new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * @param {string} path
 * @param {{ method?: string, token?: string, body?: unknown, retries?: number, retryDelayMs?: number }} opts
 */
export async function api(path, opts = {}) {
  const {
    method = 'GET',
    token,
    body,
    retries = 6,
    retryDelayMs = 1200,
  } = opts;

  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (res.status !== 429 || attempt === retries) {
      if (res.status === 429 && attempt === retries) {
        const wait = 62000;
        console.warn(`   ⏳ 429 persistente — esperando ventana throttler (${wait / 1000}s)…`);
        await sleep(wait);
        const retry = await fetch(`${BASE}${path}`, {
          method,
          headers,
          body: body !== undefined ? JSON.stringify(body) : undefined,
        });
        const retryText = await retry.text();
        let retryData = null;
        try {
          retryData = retryText ? JSON.parse(retryText) : null;
        } catch {
          retryData = retryText;
        }
        return { status: retry.status, body: retryData, ok: retry.ok };
      }
      return { status: res.status, body: data, ok: res.ok };
    }

    const wait = retryDelayMs * (attempt + 1);
    console.warn(`   ⏳ 429 rate limit — reintento ${attempt + 1}/${retries} en ${wait}ms…`);
    await sleep(wait);
  }

  return { status: 429, body: null, ok: false };
}

export async function loginAdmin() {
  const res = await api('/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  return res.body?.accessToken ?? null;
}

export async function waitForApi(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await api('/health', { retries: 0 });
      if (res.status === 200) return true;
    } catch {
      /* ignore */
    }
    await sleep(1000);
  }
  return false;
}
