#!/usr/bin/env node
/**
 * Suite QA paso a paso — minimiza falsos negativos por rate limit (429).
 *
 * Orden:
 *   1. Unit (Jest, sin BD)
 *   2. Integración reglas paquetes
 *   3. Casos de uso CU-01…CU-11
 *   4. E2E landing → realizado (+ firmas contrato)
 *   5. E2E manual WhatsApp → realizado
 *   6. Operaciones — pedidos a proveedores (qa:pedidos)
 *
 * Uso: node scripts/test-suite-completa.mjs
 * Requiere API :3000 + seed.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { waitForApi, sleep, cooldownThrottler, BASE, tddMarca } from './test-helpers.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function runNode(script) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(root, 'scripts', script)], {
      cwd: root,
      stdio: 'inherit',
      env: process.env,
    });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${script} exit ${code}`));
    });
  });
}

function runNpm(script) {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', script], {
      cwd: root,
      stdio: 'inherit',
      shell: true,
      env: process.env,
    });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`npm run ${script} exit ${code}`));
    });
  });
}

async function fase(num, titulo, fn, { cooldownAntes = 0, cooldownDespues = 2 } = {}) {
  console.log(`\n${'═'.repeat(54)}`);
  console.log(` FASE ${num}: ${titulo}`);
  console.log(`${'═'.repeat(54)}\n`);
  if (cooldownAntes > 0) await cooldownThrottler(cooldownAntes);
  await fn();
  console.log(`\n✅ FASE ${num} completada.\n`);
  if (cooldownDespues > 0) await cooldownThrottler(cooldownDespues);
  else await sleep(2000);
}

async function main() {
  console.log('\n Bosque Mágico — Suite QA completa (paso a paso)\n');
  console.log(` API objetivo: ${BASE}\n`);

  if (!(await waitForApi())) {
    console.error('❌ API no responde en /health. Levanta apps/api (yarn start:dev).');
    process.exit(1);
  }

  const started = Date.now();

  try {
    await fase(1, 'Unitarios Jest (sin BD)', () => runNpm('test:unit'));
    await fase(2, 'Integración reglas paquetes', () => runNode('test-flujos-paquetes.mjs'), {
      cooldownAntes: 62,
      cooldownDespues: 62,
    });
    await fase(3, 'Casos de uso CU-01…CU-11', () => runNode('test-casos-uso-reglas.mjs'), {
      cooldownDespues: 5,
    });
    await fase(4, 'E2E landing → evento realizado', () => runNode('test-flujo-e2e-completo.mjs'));
    await fase(5, 'E2E manual WhatsApp → realizado', () => runNode('test-flujo-e2e-manual.mjs'));
    await fase(6, 'Operaciones — pedidos proveedor', () => runNpm('qa:pedidos'), {
      cooldownAntes: 5,
    });

    const sec = ((Date.now() - started) / 1000).toFixed(1);
    console.log('\n' + '═'.repeat(54));
    console.log(` SUITE COMPLETA OK — ${sec}s`);
    console.log('═'.repeat(54));
    console.log('\nVerificar en panel:');
    console.log(`  · ${tddMarca('E2E-FULL')}  (landing)`);
    console.log(`  · ${tddMarca('E2E-MANUAL')} (WhatsApp/manual)`);
    console.log(`  · ${tddMarca('CU-TDD')}     (casos de uso)`);
    console.log('  · /operaciones — pedido proveedor generado en fase 6');
    console.log('  · /agenda — eventos confirmados tras contrato enviado\n');
  } catch (err) {
    console.error('\n❌ Suite interrumpida:', err.message);
    process.exit(1);
  }
}

main();
