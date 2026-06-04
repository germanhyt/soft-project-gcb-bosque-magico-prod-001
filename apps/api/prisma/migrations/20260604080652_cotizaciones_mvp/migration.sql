-- CreateEnum
CREATE TYPE "CanalSolicitud" AS ENUM ('landing', 'whatsapp', 'meta', 'referido', 'manual', 'otro');

-- CreateEnum
CREATE TYPE "EtapaSolicitud" AS ENUM ('nueva', 'en_atencion', 'cotizada', 'cerrada');

-- CreateEnum
CREATE TYPE "MotivoCierreSolicitud" AS ENUM ('ganada', 'perdida', 'duplicada', 'sin_respuesta', 'otro');

-- CreateEnum
CREATE TYPE "TurnoInteres" AS ENUM ('turno_1', 'turno_2', 'turno_3');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('dni', 'ruc', 'otro');

-- CreateEnum
CREATE TYPE "EtapaCotizacion" AS ENUM ('borrador', 'enviada', 'aceptada', 'cerrada');

-- CreateEnum
CREATE TYPE "MotivoCierreCotizacion" AS ENUM ('rechazada', 'vencida', 'reemplazada', 'otro');

-- CreateEnum
CREATE TYPE "CanalEnvio" AS ENUM ('whatsapp', 'email');

-- CreateEnum
CREATE TYPE "TipoItemCotizacion" AS ENUM ('show', 'catering', 'extra', 'manual');

-- CreateEnum
CREATE TYPE "CategoriaProducto" AS ENUM ('show', 'catering', 'extra', 'paquete', 'espacio');

-- CreateEnum
CREATE TYPE "EtapaProducto" AS ENUM ('activo', 'inactivo');

-- CreateEnum
CREATE TYPE "EtapaEvento" AS ENUM ('por_confirmar', 'confirmado', 'realizado', 'cancelado');

-- CreateTable
CREATE TABLE "bosque_magico_configuraciones" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" JSONB NOT NULL,
    "descripcion" TEXT,
    "es_publico" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bosque_magico_configuraciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bosque_magico_solicitudes" (
    "id" TEXT NOT NULL,
    "fecha_ingreso" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nombre_contacto" TEXT NOT NULL,
    "celular" TEXT NOT NULL,
    "correo" TEXT,
    "canal" "CanalSolicitud" NOT NULL,
    "detalle_origen" TEXT,
    "fecha_tentativa" DATE,
    "turno_interes" "TurnoInteres",
    "cantidad_ninos_estimada" INTEGER,
    "etapa" "EtapaSolicitud" NOT NULL DEFAULT 'nueva',
    "motivo_cierre" "MotivoCierreSolicitud",
    "usuario_asignado_id" TEXT,
    "ultimo_contacto_en" TIMESTAMP(3),
    "proximo_seguimiento_en" TIMESTAMP(3),
    "notas" TEXT,
    "payload_origen" JSONB,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bosque_magico_solicitudes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bosque_magico_clientes" (
    "id" TEXT NOT NULL,
    "nombre_completo" TEXT NOT NULL,
    "tipo_documento" "TipoDocumento",
    "numero_documento" TEXT,
    "celular" TEXT NOT NULL,
    "correo" TEXT,
    "direccion" TEXT,
    "distrito" TEXT,
    "notas" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bosque_magico_clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bosque_magico_cumpleaneros" (
    "id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "edad" INTEGER,
    "fecha_cumpleanos" DATE,
    "tematica_favorita" TEXT,
    "notas" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bosque_magico_cumpleaneros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bosque_magico_productos" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" "CategoriaProducto" NOT NULL,
    "precio_lunes_viernes" DECIMAL(10,2) NOT NULL,
    "precio_fin_semana" DECIMAL(10,2) NOT NULL,
    "unidad" TEXT NOT NULL DEFAULT 'servicio',
    "cantidad_minima" INTEGER NOT NULL DEFAULT 1,
    "descripcion" TEXT,
    "etapa" "EtapaProducto" NOT NULL DEFAULT 'activo',
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bosque_magico_productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bosque_magico_cotizaciones" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "solicitud_id" TEXT,
    "cliente_id" TEXT NOT NULL,
    "cumpleanero_id" TEXT NOT NULL,
    "token_publico" TEXT NOT NULL,
    "fecha_evento" DATE NOT NULL,
    "turno" "TurnoInteres" NOT NULL,
    "cantidad_ninos" INTEGER NOT NULL,
    "tematica" TEXT,
    "paquete" TEXT,
    "monto_base" DECIMAL(10,2) NOT NULL,
    "monto_ninos_extra" DECIMAL(10,2) NOT NULL,
    "monto_items" DECIMAL(10,2) NOT NULL,
    "monto_total" DECIMAL(10,2) NOT NULL,
    "etapa" "EtapaCotizacion" NOT NULL DEFAULT 'borrador',
    "motivo_cierre" "MotivoCierreCotizacion",
    "canal_envio" "CanalEnvio",
    "enviada_en" TIMESTAMP(3),
    "aceptada_en" TIMESTAMP(3),
    "cerrada_en" TIMESTAMP(3),
    "notas" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bosque_magico_cotizaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bosque_magico_items_cotizacion" (
    "id" TEXT NOT NULL,
    "cotizacion_id" TEXT NOT NULL,
    "producto_id" TEXT,
    "tipo" "TipoItemCotizacion" NOT NULL,
    "nombre" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "notas" TEXT,

    CONSTRAINT "bosque_magico_items_cotizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bosque_magico_eventos" (
    "id" TEXT NOT NULL,
    "cotizacion_id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "cumpleanero_id" TEXT NOT NULL,
    "fecha_evento" DATE NOT NULL,
    "turno" "TurnoInteres" NOT NULL,
    "zona" TEXT NOT NULL DEFAULT 'Bosque Mágico',
    "tematica" TEXT,
    "cantidad_ninos" INTEGER NOT NULL,
    "monto_total" DECIMAL(10,2) NOT NULL,
    "etapa" "EtapaEvento" NOT NULL DEFAULT 'por_confirmar',
    "confirmado_en" TIMESTAMP(3),
    "realizado_en" TIMESTAMP(3),
    "cancelado_en" TIMESTAMP(3),
    "notas" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bosque_magico_eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bosque_magico_logs_mensajes" (
    "id" TEXT NOT NULL,
    "cotizacion_id" TEXT NOT NULL,
    "canal" "CanalEnvio" NOT NULL,
    "destino" TEXT NOT NULL,
    "exito" BOOLEAN NOT NULL DEFAULT true,
    "detalle" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bosque_magico_logs_mensajes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bosque_magico_auditorias" (
    "id" TEXT NOT NULL,
    "tipo_entidad" TEXT NOT NULL,
    "entidad_id" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "actor_tipo" TEXT NOT NULL,
    "actor_id" TEXT,
    "antes" JSONB,
    "despues" JSONB,
    "metadata" JSONB,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bosque_magico_auditorias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bosque_magico_configuraciones_clave_key" ON "bosque_magico_configuraciones"("clave");

-- CreateIndex
CREATE INDEX "bosque_magico_solicitudes_etapa_idx" ON "bosque_magico_solicitudes"("etapa");

-- CreateIndex
CREATE INDEX "bosque_magico_solicitudes_canal_idx" ON "bosque_magico_solicitudes"("canal");

-- CreateIndex
CREATE INDEX "bosque_magico_solicitudes_celular_idx" ON "bosque_magico_solicitudes"("celular");

-- CreateIndex
CREATE INDEX "bosque_magico_clientes_celular_idx" ON "bosque_magico_clientes"("celular");

-- CreateIndex
CREATE INDEX "bosque_magico_cumpleaneros_cliente_id_idx" ON "bosque_magico_cumpleaneros"("cliente_id");

-- CreateIndex
CREATE UNIQUE INDEX "bosque_magico_productos_codigo_key" ON "bosque_magico_productos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "bosque_magico_cotizaciones_codigo_key" ON "bosque_magico_cotizaciones"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "bosque_magico_cotizaciones_token_publico_key" ON "bosque_magico_cotizaciones"("token_publico");

-- CreateIndex
CREATE INDEX "bosque_magico_cotizaciones_etapa_idx" ON "bosque_magico_cotizaciones"("etapa");

-- CreateIndex
CREATE INDEX "bosque_magico_cotizaciones_solicitud_id_idx" ON "bosque_magico_cotizaciones"("solicitud_id");

-- CreateIndex
CREATE INDEX "bosque_magico_items_cotizacion_cotizacion_id_idx" ON "bosque_magico_items_cotizacion"("cotizacion_id");

-- CreateIndex
CREATE INDEX "bosque_magico_eventos_fecha_evento_turno_zona_idx" ON "bosque_magico_eventos"("fecha_evento", "turno", "zona");

-- CreateIndex
CREATE INDEX "bosque_magico_eventos_etapa_idx" ON "bosque_magico_eventos"("etapa");

-- CreateIndex
CREATE INDEX "bosque_magico_logs_mensajes_cotizacion_id_idx" ON "bosque_magico_logs_mensajes"("cotizacion_id");

-- CreateIndex
CREATE INDEX "bosque_magico_auditorias_tipo_entidad_entidad_id_idx" ON "bosque_magico_auditorias"("tipo_entidad", "entidad_id");

-- AddForeignKey
ALTER TABLE "bosque_magico_cumpleaneros" ADD CONSTRAINT "bosque_magico_cumpleaneros_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "bosque_magico_clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bosque_magico_cotizaciones" ADD CONSTRAINT "bosque_magico_cotizaciones_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "bosque_magico_solicitudes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bosque_magico_cotizaciones" ADD CONSTRAINT "bosque_magico_cotizaciones_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "bosque_magico_clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bosque_magico_cotizaciones" ADD CONSTRAINT "bosque_magico_cotizaciones_cumpleanero_id_fkey" FOREIGN KEY ("cumpleanero_id") REFERENCES "bosque_magico_cumpleaneros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bosque_magico_items_cotizacion" ADD CONSTRAINT "bosque_magico_items_cotizacion_cotizacion_id_fkey" FOREIGN KEY ("cotizacion_id") REFERENCES "bosque_magico_cotizaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bosque_magico_items_cotizacion" ADD CONSTRAINT "bosque_magico_items_cotizacion_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "bosque_magico_productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bosque_magico_eventos" ADD CONSTRAINT "bosque_magico_eventos_cotizacion_id_fkey" FOREIGN KEY ("cotizacion_id") REFERENCES "bosque_magico_cotizaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bosque_magico_eventos" ADD CONSTRAINT "bosque_magico_eventos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "bosque_magico_clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bosque_magico_eventos" ADD CONSTRAINT "bosque_magico_eventos_cumpleanero_id_fkey" FOREIGN KEY ("cumpleanero_id") REFERENCES "bosque_magico_cumpleaneros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bosque_magico_logs_mensajes" ADD CONSTRAINT "bosque_magico_logs_mensajes_cotizacion_id_fkey" FOREIGN KEY ("cotizacion_id") REFERENCES "bosque_magico_cotizaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
