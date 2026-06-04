export const CRUMB_INICIO = { label: 'Inicio', to: '/' } as const;

export function crumb(label: string, to?: string) {
  return to ? { label, to } : { label };
}
