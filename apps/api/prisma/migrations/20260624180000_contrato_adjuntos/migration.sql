-- CreateEnum
CREATE TYPE "TipoAdjuntoContrato" AS ENUM ('comprobante_pago', 'documento_contabilidad');

-- CreateTable
CREATE TABLE "contrato_adjuntos" (
    "id" TEXT NOT NULL,
    "contrato_id" TEXT NOT NULL,
    "tipo" "TipoAdjuntoContrato" NOT NULL,
    "nombre_original" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mime_type" TEXT,
    "tamano_bytes" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contrato_adjuntos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contrato_adjuntos_contrato_id_tipo_key" ON "contrato_adjuntos"("contrato_id", "tipo");

-- AddForeignKey
ALTER TABLE "contrato_adjuntos" ADD CONSTRAINT "contrato_adjuntos_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
