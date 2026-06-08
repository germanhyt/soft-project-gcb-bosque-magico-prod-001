#!/usr/bin/env bash
# Reparar sandbox en VPS cuando /health responde OK pero login o catálogo devuelven 500 (P1000).
# Uso en el VPS, dentro del repo:
#   bash scripts/sandbox-repair.sh

set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.sandbox.yml}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Estado contenedores"
docker compose -f "$COMPOSE_FILE" ps

echo "==> Sincronizar contraseña postgres (postgres/postgres)"
docker compose -f "$COMPOSE_FILE" exec -T postgres \
  psql -U postgres -d bosque_magico \
  -c "ALTER USER postgres WITH PASSWORD 'postgres';" \
  || echo "AVISO: no se pudo ejecutar ALTER USER (¿postgres caído?)"

echo "==> Recrear postgres (entrypoint sincroniza password) y rebuild API"
docker compose -f "$COMPOSE_FILE" up -d --build postgres api

echo "==> Esperar API..."
for i in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:3001/api/health" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo "==> Logs API (últimas líneas)"
docker compose -f "$COMPOSE_FILE" logs api --tail 40

echo "==> Smoke rápido"
curl -sf "http://127.0.0.1:3001/api/health"
echo

curl -sf "http://127.0.0.1:3001/api/public/bosque-magico/catalogo" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('shows', len(d['productos']['shows']))"

HTTP=$(curl -sS -o /tmp/sandbox-login.json -w "%{http_code}" \
  -X POST "http://127.0.0.1:3001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bosquemagico.test","password":"BosqueDev123!"}')
echo "login HTTP $HTTP"
if [ "$HTTP" != "200" ] && [ "$HTTP" != "201" ]; then
  cat /tmp/sandbox-login.json
  exit 1
fi

echo "OK — sandbox reparado (health, catálogo y login)."
