-- Turno personalizado (3h) y rango persistido en solicitud / cotización / evento.
ALTER TYPE "TurnoInteres" ADD VALUE IF NOT EXISTS 'turno_personalizado';

ALTER TABLE "solicitudes" ADD COLUMN IF NOT EXISTS "horario_inicio" TEXT;
ALTER TABLE "solicitudes" ADD COLUMN IF NOT EXISTS "horario_fin" TEXT;

ALTER TABLE "cotizaciones" ADD COLUMN IF NOT EXISTS "horario_inicio" TEXT;
ALTER TABLE "cotizaciones" ADD COLUMN IF NOT EXISTS "horario_fin" TEXT;

ALTER TABLE "eventos" ADD COLUMN IF NOT EXISTS "horario_inicio" TEXT;
ALTER TABLE "eventos" ADD COLUMN IF NOT EXISTS "horario_fin" TEXT;
