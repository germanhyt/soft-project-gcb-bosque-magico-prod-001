-- CreateTable
CREATE TABLE "panel_notificaciones" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "entidad_tipo" TEXT,
    "entidad_id" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "panel_notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "panel_notificaciones_usuario" (
    "id" TEXT NOT NULL,
    "notificacion_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "oculta" BOOLEAN NOT NULL DEFAULT false,
    "leida_en" TIMESTAMP(3),
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "panel_notificaciones_usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "panel_notificaciones_creado_en_idx" ON "panel_notificaciones"("creado_en" DESC);

-- CreateIndex
CREATE INDEX "panel_notificaciones_usuario_usuario_id_oculta_idx" ON "panel_notificaciones_usuario"("usuario_id", "oculta");

-- CreateIndex
CREATE UNIQUE INDEX "panel_notificaciones_usuario_notificacion_id_usuario_id_key" ON "panel_notificaciones_usuario"("notificacion_id", "usuario_id");

-- AddForeignKey
ALTER TABLE "panel_notificaciones_usuario" ADD CONSTRAINT "panel_notificaciones_usuario_notificacion_id_fkey" FOREIGN KEY ("notificacion_id") REFERENCES "panel_notificaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "panel_notificaciones_usuario" ADD CONSTRAINT "panel_notificaciones_usuario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
