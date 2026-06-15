export function mapTareaEventoResponse<T extends Record<string, unknown>>(tarea: T) {
  return { ...tarea };
}
