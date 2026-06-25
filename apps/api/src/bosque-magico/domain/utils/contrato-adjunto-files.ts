import * as fs from 'node:fs';
import * as path from 'node:path';

export function directorioAdjuntosContratos(): string {
  return path.join(process.cwd(), 'uploads', 'contratos');
}

export function eliminarArchivoAdjuntoContrato(filename: string): void {
  const filepath = path.join(directorioAdjuntosContratos(), filename);
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
}
