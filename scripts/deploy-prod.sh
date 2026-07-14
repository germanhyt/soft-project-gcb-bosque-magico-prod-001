#!/usr/bin/env bash
# Despliegue producción Bosque Mágico (dominios limpios, BD solo maestras vía seed).
# Uso en el VPS:
#   cd /home/projects/proyecto-bosque-magico
#   bash scripts/deploy-prod.sh
#
# Variables opcionales: PROD_JWT_SECRET, PROD_ADMIN_PASSWORD, PROD_POSTGRES_PASSWORD,
#   PROD_API_RUN_DB_SEED (default true en primera vez; poner false tras seed).

set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Rama"
git fetch --all
git checkout sandbox
git pull origin sandbox
echo "    $(git log -1 --oneline)"

echo "==> Rebuild prod (postgres + api + panel + landing)"
docker compose -f "$COMPOSE_FILE" up -d --build postgres
docker compose -f "$COMPOSE_FILE" up -d --build api panel landing

echo "==> Estado"
docker compose -f "$COMPOSE_FILE" ps

echo "==> Esperar API local :3011..."
for i in $(seq 1 50); do
  if curl -sf "http://127.0.0.1:3011/api/health" >/dev/null 2>&1; then
    echo "    API OK en intento $i"
    break
  fi
  if [ "$i" -eq 50 ]; then
    echo "ERROR: API prod no respondió"
    docker compose -f "$COMPOSE_FILE" logs api --tail 120
    exit 1
  fi
  sleep 3
done

echo "==> Smoke local"
curl -sf "http://127.0.0.1:3011/api/health"
echo
curl -sf "http://127.0.0.1:3011/api/public/bosque-magico/catalogo" | head -c 160
echo "..."

echo "OK — prod containers up ($(git rev-parse --short HEAD))"
echo "    Landing :4184  Panel :4183  API :3011"
echo "    Tras nginx/SSL: https://bosquemagico.gcbprojects.site / https://admin.bosquemagico.gcbprojects.site"
echo "    Si el seed ya corrió, exporta PROD_API_RUN_DB_SEED=false en siguientes deploys."
