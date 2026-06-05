#!/usr/bin/env bash
# Reparar sandbox en VPS cuando la API responde /health pero falla login o catálogo (500).
# Uso en el VPS, dentro del repo:
#   bash scripts/sandbox-repair.sh

set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.sandbox.yml}"

echo "==> Estado contenedores"
docker compose -f "$COMPOSE_FILE" ps

echo "==> Rebuild API (migrate + seed en entrypoint)"
docker compose -f "$COMPOSE_FILE" up -d --build api

echo "==> Logs API (últimas líneas)"
docker compose -f "$COMPOSE_FILE" logs api --tail 100

echo "==> Smoke rápido"
curl -sf "http://127.0.0.1:3001/api/health"
curl -sf "http://127.0.0.1:3001/api/public/bosque-magico/catalogo" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('shows', len(d['productos']['shows']))"

echo "OK — si falla, revisa DATABASE_URL y volumen postgres del compose sandbox."
