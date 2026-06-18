#!/bin/sh
set -e

cd /app

echo "[api] Ejecutando migraciones..."
TRIES=0
MAX_TRIES=20
until npm exec --workspace=@bosque/api prisma migrate deploy --schema apps/api/prisma/schema.prisma; do
  TRIES=$((TRIES + 1))
  if [ "$TRIES" -ge "$MAX_TRIES" ]; then
    echo "[api] ERROR: no se pudo conectar a la base de datos tras ${MAX_TRIES} intentos"
    exit 1
  fi
  echo "[api] DB no lista (intento ${TRIES}/${MAX_TRIES}), reintentando en 3s..."
  sleep 3
done

if [ "${API_RUN_DB_SEED}" = "true" ] || [ "${API_RUN_DB_SEED}" = "1" ]; then
  echo "[api] Ejecutando seed base (idempotente)..."
  npm exec --workspace=@bosque/api prisma db seed --schema apps/api/prisma/schema.prisma || {
    echo "[api] AVISO: seed falló o ya estaba aplicado; continuando..."
  }
else
  echo "[api] Seed base omitido (API_RUN_DB_SEED=${API_RUN_DB_SEED:-false}). Migraciones aplicadas."
fi

echo "[api] Iniciando servidor..."
exec node apps/api/dist/src/main.js
