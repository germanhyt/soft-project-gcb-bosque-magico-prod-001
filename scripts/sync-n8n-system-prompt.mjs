/**
 * Sincroniza system-prompt.md → workflows n8n (campo systemMessage del agente).
 * Uso: node scripts/sync-n8n-system-prompt.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const promptPath = path.join(root, '.docs/doc-n8n/funcionamiento-actual/system-prompt.md');

const workflowPaths = [
  path.join(root, '.docs/doc-n8n/funcionamiento-actual/Bosque Magico - Agente IA Solicitudes WhatsApp.json'),
  path.join(root, '.docs/doc-n8n/BosqueMagico-AgenteIA-Solicitudes-WhatsApp.workflow.json'),
];

const prompt = fs.readFileSync(promptPath, 'utf8').trim().replace(/\r\n/g, '\n');
const systemMessage = `=${prompt}`;

let updated = 0;
for (const workflowPath of workflowPaths) {
  if (!fs.existsSync(workflowPath)) {
    console.warn(`Omitido (no existe): ${workflowPath}`);
    continue;
  }
  const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
  let found = false;
  for (const node of workflow.nodes ?? []) {
    if (node.parameters?.options?.systemMessage != null) {
      node.parameters.options.systemMessage = systemMessage;
      found = true;
    }
  }
  if (!found) {
    console.warn(`Sin nodo systemMessage: ${workflowPath}`);
    continue;
  }
  fs.writeFileSync(workflowPath, `${JSON.stringify(workflow, null, 2)}\n`, 'utf8');
  updated += 1;
  console.log(`OK ${path.relative(root, workflowPath)}`);
}

console.log(`Prompt sincronizado en ${updated} workflow(s).`);
