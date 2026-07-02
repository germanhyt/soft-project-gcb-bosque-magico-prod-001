#!/usr/bin/env bash
# Sincroniza catálogo en sandbox VPS (productos/piqueos/composición) sin tocar config ni usuarios.
# Ejecutar EN EL VPS:
#   cd /home/projects/proyecto-bosque-magico
#   bash scripts/vps-sync-catalogo.sh
#
# Desde local (con SSH a MiVPS):
#   bash scripts/vps-sync-catalogo.sh --remote

set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.sandbox.yml}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REMOTE="${1:-}"

run_sync() {
  cd "$ROOT"
  echo "==> Migraciones (por si hay pendientes)"
  docker compose -f "$COMPOSE_FILE" exec -T api sh -c \
    'npm exec --workspace=@bosque/api prisma migrate deploy --schema apps/api/prisma/schema.prisma'

  echo "==> Seed catálogo (sin config/usuarios)"
  docker compose -f "$COMPOSE_FILE" exec -T api sh -c \
    'node apps/api/dist/prisma/seed-catalogo.js'

  echo "==> Verificar piqueos en catálogo público"
  curl -sf "http://127.0.0.1:3001/api/public/bosque-magico/catalogo" \
    | node -e "
      let d='';
      process.stdin.on('data',c=>d+=c);
      process.stdin.on('end',()=>{
        const j=JSON.parse(d);
        const c=j.productos?.catering||[];
        const piq=c.filter(x=>String(x.codigo||'').startsWith('PIQ-'));
        console.log('catering:', c.length, '| piqueos:', piq.length);
        if (piq.length < 1) process.exit(1);
      });
    "
  echo "OK — catálogo sincronizado"
}

if [ "$REMOTE" = "--remote" ]; then
  SSH_HOST="${VPS_SSH_HOST:-MiVPS}"
  SSH_KEY="${VPS_SSH_KEY:-$HOME/.ssh/vps_estacionamiento}"
  SSH_USER="${VPS_SSH_USER:-root}"
  REPO="${VPS_REPO_PATH:-/home/projects/proyecto-bosque-magico}"
  ssh -i "$SSH_KEY" -o BatchMode=yes "${SSH_USER}@${SSH_HOST:-62.169.23.24}" \
    "cd '$REPO' && git pull origin sandbox && docker compose -f docker-compose.sandbox.yml up -d --build api && bash scripts/vps-sync-catalogo.sh"
else
  run_sync
fi
