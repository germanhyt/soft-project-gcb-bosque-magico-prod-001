#!/usr/bin/env bash
# Despliegue manual sandbox en VPS (mismo flujo que .github/workflows/deploy-sandbox.yml).
# Uso en el VPS:
#   cd /home/projects/proyecto-bosque-magico
#   bash scripts/deploy-sandbox.sh

set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.sandbox.yml}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Rama actual"
git fetch --all
git checkout sandbox
git pull origin sandbox
echo "    $(git log -1 --oneline)"

echo "==> Rebuild servicios (postgres + api + panel + landing)"
docker compose -f "$COMPOSE_FILE" up -d --build postgres
docker compose -f "$COMPOSE_FILE" up -d --build api panel landing

echo "==> Estado contenedores"
docker compose -f "$COMPOSE_FILE" ps

echo "==> Esperar API local..."
for i in $(seq 1 40); do
  if curl -sf "http://127.0.0.1:3001/api/health" >/dev/null 2>&1; then
    echo "    API OK en intento $i"
    break
  fi
  if [ "$i" -eq 40 ]; then
    echo "ERROR: API no respondió tras 40 intentos"
    docker compose -f "$COMPOSE_FILE" logs api --tail 100
    exit 1
  fi
  sleep 3
done

echo "==> Logs API (últimas líneas)"
docker compose -f "$COMPOSE_FILE" logs api --tail 60

echo "==> Smoke local"
curl -sf "http://127.0.0.1:3001/api/health"
echo
curl -sf "http://127.0.0.1:3001/api/public/bosque-magico/catalogo" \
  | head -c 120
echo "..."

echo "==> Smoke público (HTTPS)"
curl -sf "https://sandbox-api-bosque.gcbprojects.site/api/health"
echo
curl -sf "https://sandbox-api-bosque.gcbprojects.site/api/public/bosque-magico/catalogo" \
  | head -c 120
echo "..."

echo "OK — sandbox desplegado ($(git rev-parse --short HEAD))"
