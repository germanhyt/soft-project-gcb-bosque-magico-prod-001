-- CreateEnum
CREATE TYPE "EtapaContrato" AS ENUM ('borrador', 'enviado', 'firmado', 'anulado');

-- CreateEnum
CREATE TYPE "TipoComprobanteContrato" AS ENUM ('boleta', 'factura');

-- AlterTable
ALTER TABLE "auditorias" RENAME CONSTRAINT "bosque_magico_auditorias_pkey" TO "auditorias_pkey";

-- AlterTable
ALTER TABLE "clientes" RENAME CONSTRAINT "bosque_magico_clientes_pkey" TO "clientes_pkey";

-- AlterTable
ALTER TABLE "configuraciones" RENAME CONSTRAINT "bosque_magico_configuraciones_pkey" TO "configuraciones_pkey";

-- AlterTable
ALTER TABLE "cotizaciones" RENAME CONSTRAINT "bosque_magico_cotizaciones_pkey" TO "cotizaciones_pkey";

-- AlterTable
ALTER TABLE "cumpleaneros" RENAME CONSTRAINT "bosque_magico_cumpleaneros_pkey" TO "cumpleaneros_pkey";

-- AlterTable
ALTER TABLE "eventos" RENAME CONSTRAINT "bosque_magico_eventos_pkey" TO "eventos_pkey";

-- AlterTable
ALTER TABLE "items_cotizacion" RENAME CONSTRAINT "bosque_magico_items_cotizacion_pkey" TO "items_cotizacion_pkey";

-- AlterTable
ALTER TABLE "logs_mensajes" RENAME CONSTRAINT "bosque_magico_logs_mensajes_pkey" TO "logs_mensajes_pkey";

-- AlterTable
ALTER TABLE "productos" RENAME CONSTRAINT "bosque_magico_productos_pkey" TO "productos_pkey";

-- AlterTable
ALTER TABLE "solicitudes" RENAME CONSTRAINT "bosque_magico_solicitudes_pkey" TO "solicitudes_pkey";

-- AlterTable
ALTER TABLE "usuarios" RENAME CONSTRAINT "bosque_magico_usuarios_pkey" TO "usuarios_pkey";

-- CreateTable
CREATE TABLE "contratos" (
    "id" TEXT NOT NULL,
    "evento_id" TEXT NOT NULL,
    "cotizacion_id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "fecha_emision" DATE NOT NULL,
    "monto_total" DECIMAL(10,2) NOT NULL,
    "monto_adelanto" DECIMAL(10,2) NOT NULL,
    "monto_pendiente" DECIMAL(10,2) NOT NULL,
    "monto_garantia" DECIMAL(10,2) NOT NULL,
    "adelanto_1_monto" DECIMAL(10,2) NOT NULL,
    "adelanto_1_fecha" DATE,
    "adelanto_2_monto" DECIMAL(10,2),
    "adelanto_2_fecha" DATE,
    "tipo_comprobante" "TipoComprobanteContrato" NOT NULL,
    "documento_tributario" TEXT NOT NULL,
    "numero_documento" TEXT NOT NULL,
    "horario_inicio" TEXT NOT NULL,
    "horario_fin" TEXT NOT NULL,
    "terminos_version" TEXT NOT NULL,
    "snapshot_json" JSONB NOT NULL,
    "etapa" "EtapaContrato" NOT NULL DEFAULT 'borrador',
    "enviado_en" TIMESTAMP(3),
    "firmado_en" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contratos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contratos_evento_id_key" ON "contratos"("evento_id");

-- CreateIndex
CREATE UNIQUE INDEX "contratos_numero_key" ON "contratos"("numero");

-- CreateIndex
CREATE INDEX "contratos_etapa_idx" ON "contratos"("etapa");

-- CreateIndex
CREATE INDEX "contratos_cotizacion_id_idx" ON "contratos"("cotizacion_id");

-- RenameForeignKey
ALTER TABLE "cotizaciones" RENAME CONSTRAINT "bosque_magico_cotizaciones_cliente_id_fkey" TO "cotizaciones_cliente_id_fkey";

-- RenameForeignKey
ALTER TABLE "cotizaciones" RENAME CONSTRAINT "bosque_magico_cotizaciones_cumpleanero_id_fkey" TO "cotizaciones_cumpleanero_id_fkey";

-- RenameForeignKey
ALTER TABLE "cotizaciones" RENAME CONSTRAINT "bosque_magico_cotizaciones_solicitud_id_fkey" TO "cotizaciones_solicitud_id_fkey";

-- RenameForeignKey
ALTER TABLE "cumpleaneros" RENAME CONSTRAINT "bosque_magico_cumpleaneros_cliente_id_fkey" TO "cumpleaneros_cliente_id_fkey";

-- RenameForeignKey
ALTER TABLE "eventos" RENAME CONSTRAINT "bosque_magico_eventos_cliente_id_fkey" TO "eventos_cliente_id_fkey";

-- RenameForeignKey
ALTER TABLE "eventos" RENAME CONSTRAINT "bosque_magico_eventos_cotizacion_id_fkey" TO "eventos_cotizacion_id_fkey";

-- RenameForeignKey
ALTER TABLE "eventos" RENAME CONSTRAINT "bosque_magico_eventos_cumpleanero_id_fkey" TO "eventos_cumpleanero_id_fkey";

-- RenameForeignKey
ALTER TABLE "items_cotizacion" RENAME CONSTRAINT "bosque_magico_items_cotizacion_cotizacion_id_fkey" TO "items_cotizacion_cotizacion_id_fkey";

-- RenameForeignKey
ALTER TABLE "items_cotizacion" RENAME CONSTRAINT "bosque_magico_items_cotizacion_producto_id_fkey" TO "items_cotizacion_producto_id_fkey";

-- RenameForeignKey
ALTER TABLE "logs_mensajes" RENAME CONSTRAINT "bosque_magico_logs_mensajes_cotizacion_id_fkey" TO "logs_mensajes_cotizacion_id_fkey";

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_cotizacion_id_fkey" FOREIGN KEY ("cotizacion_id") REFERENCES "cotizaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "bosque_magico_auditorias_tipo_entidad_entidad_id_idx" RENAME TO "auditorias_tipo_entidad_entidad_id_idx";

-- RenameIndex
ALTER INDEX "bosque_magico_clientes_celular_idx" RENAME TO "clientes_celular_idx";

-- RenameIndex
ALTER INDEX "bosque_magico_configuraciones_clave_key" RENAME TO "configuraciones_clave_key";

-- RenameIndex
ALTER INDEX "bosque_magico_cotizaciones_codigo_key" RENAME TO "cotizaciones_codigo_key";

-- RenameIndex
ALTER INDEX "bosque_magico_cotizaciones_etapa_idx" RENAME TO "cotizaciones_etapa_idx";

-- RenameIndex
ALTER INDEX "bosque_magico_cotizaciones_solicitud_id_idx" RENAME TO "cotizaciones_solicitud_id_idx";

-- RenameIndex
ALTER INDEX "bosque_magico_cotizaciones_token_publico_key" RENAME TO "cotizaciones_token_publico_key";

-- RenameIndex
ALTER INDEX "bosque_magico_cumpleaneros_cliente_id_idx" RENAME TO "cumpleaneros_cliente_id_idx";

-- RenameIndex
ALTER INDEX "bosque_magico_eventos_etapa_idx" RENAME TO "eventos_etapa_idx";

-- RenameIndex
ALTER INDEX "bosque_magico_eventos_fecha_evento_turno_zona_idx" RENAME TO "eventos_fecha_evento_turno_zona_idx";

-- RenameIndex
ALTER INDEX "bosque_magico_items_cotizacion_cotizacion_id_idx" RENAME TO "items_cotizacion_cotizacion_id_idx";

-- RenameIndex
ALTER INDEX "bosque_magico_logs_mensajes_cotizacion_id_idx" RENAME TO "logs_mensajes_cotizacion_id_idx";

-- RenameIndex
ALTER INDEX "bosque_magico_productos_codigo_key" RENAME TO "productos_codigo_key";

-- RenameIndex
ALTER INDEX "bosque_magico_solicitudes_canal_idx" RENAME TO "solicitudes_canal_idx";

-- RenameIndex
ALTER INDEX "bosque_magico_solicitudes_celular_idx" RENAME TO "solicitudes_celular_idx";

-- RenameIndex
ALTER INDEX "bosque_magico_solicitudes_etapa_idx" RENAME TO "solicitudes_etapa_idx";

-- RenameIndex
ALTER INDEX "bosque_magico_usuarios_email_key" RENAME TO "usuarios_email_key";
