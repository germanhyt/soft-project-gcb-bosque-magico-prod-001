/** URL absoluta para assets servidos por la API (`/api/uploads/...`). */
export function resolveAssetUrl(path: string | null | undefined): string | undefined {
  if (!path?.trim()) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  const normalized = path.startsWith('/') ? path : `/${path}`;
  const base = (import.meta.env.VITE_API_URL as string | undefined)?.trim() ?? '';

  if (base.startsWith('http://') || base.startsWith('https://')) {
    try {
      const origin = new URL(base).origin;
      return `${origin}${normalized}`;
    } catch {
      /* fallback abajo */
    }
  }

  if (typeof window !== 'undefined') {
    return `${window.location.origin}${normalized}`;
  }

  return normalized;
}
