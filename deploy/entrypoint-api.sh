#!/bin/sh
set -e

cd /app

echo "[api] Ejecutando migraciones..."
npm exec --workspace=@bosque/api prisma migrate deploy --schema apps/api/prisma/schema.prisma

echo "[api] Ejecutando seed (idempotente)..."
npm exec --workspace=@bosque/api prisma db seed --schema apps/api/prisma/schema.prisma || {
  echo "[api] AVISO: seed falló o ya estaba aplicado; continuando..."
}

echo "[api] Iniciando servidor..."
exec node apps/api/dist/src/main.js
