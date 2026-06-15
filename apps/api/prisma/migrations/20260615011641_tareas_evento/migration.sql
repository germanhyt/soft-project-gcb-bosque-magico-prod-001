-- CreateEnum
CREATE TYPE "EtapaTareaEvento" AS ENUM ('pendiente', 'en_proceso', 'completado', 'bloqueado');

-- CreateTable
CREATE TABLE "tareas_evento" (
    "id" TEXT NOT NULL,
    "evento_id" TEXT NOT NULL,
    "area" "AreaPedido" NOT NULL,
    "nombre" TEXT NOT NULL,
    "responsable" TEXT,
    "etapa" "EtapaTareaEvento" NOT NULL DEFAULT 'pendiente',
    "fecha_vencimiento" DATE,
    "notas" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tareas_evento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tareas_evento_evento_id_idx" ON "tareas_evento"("evento_id");

-- AddForeignKey
ALTER TABLE "tareas_evento" ADD CONSTRAINT "tareas_evento_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
