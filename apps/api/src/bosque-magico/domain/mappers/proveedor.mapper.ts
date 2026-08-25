export function mapProveedorResponse<T extends Record<string, unknown>>(
  proveedor: T,
) {
  return { ...proveedor };
}
