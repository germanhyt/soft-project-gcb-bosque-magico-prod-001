-- Tipos de adjunto para imágenes de firma en contrato
ALTER TYPE "TipoAdjuntoContrato" ADD VALUE IF NOT EXISTS 'firma_cliente';
ALTER TYPE "TipoAdjuntoContrato" ADD VALUE IF NOT EXISTS 'firma_empresa';
