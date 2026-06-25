import * as fs from 'node:fs';
import * as path from 'node:path';

export function directorioImagenesProductos() {
  return path.join(process.cwd(), 'uploads', 'productos');
}

export function eliminarArchivoUploadProducto(url: string) {
  if (!url?.startsWith('/api/uploads/productos/')) return;
  const filename = path.basename(url);
  const filepath = path.join(directorioImagenesProductos(), filename);
  if (!fs.existsSync(filepath)) return;
  try {
    fs.unlinkSync(filepath);
  } catch {
    /* ignore */
  }
}

export function eliminarArchivosImagenProducto(productoId: string) {
  const dir = directorioImagenesProductos();
  if (!fs.existsSync(dir)) return;
  for (const old of fs.readdirSync(dir)) {
    if (old.startsWith(productoId)) {
      try {
        fs.unlinkSync(path.join(dir, old));
      } catch {
        /* ignore */
      }
    }
  }
}
