#!/bin/sh
# Sandbox: alinear contraseña de postgres con POSTGRES_PASSWORD en cada arranque.
# Evita P1000 cuando el volumen conserva un hash distinto al del compose.
set -e

if [ -z "${POSTGRES_PASSWORD:-}" ]; then
  echo "[postgres] POSTGRES_PASSWORD no definido"
  exit 1
fi

docker-entrypoint.sh postgres &
pg_pid=$!

until pg_isready -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-postgres}" >/dev/null 2>&1; do
  sleep 1
done

psql -v ON_ERROR_STOP=1 -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-postgres}" <<-EOSQL
  ALTER USER "${POSTGRES_USER:-postgres}" WITH PASSWORD '${POSTGRES_PASSWORD}';
EOSQL

echo "[postgres] Contraseña sincronizada con POSTGRES_PASSWORD"

wait "$pg_pid"
