/** URL absoluta para assets servidos por la API (`/api/uploads/...`). */
export function resolveAssetUrl(path: string | null | undefined): string | undefined {
  if (!path?.trim()) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = import.meta.env.VITE_API_URL ?? '';
  if (base) {
    try {
      const origin = new URL(base).origin;
      return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
    } catch {
      /* usar path relativo */
    }
  }
  return path;
}
