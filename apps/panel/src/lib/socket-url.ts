/** Origen del servidor Socket.IO (API). En dev con proxy Vite, undefined = mismo origen del panel. */
export function resolveSocketServerUrl(): string | undefined {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl || typeof apiUrl !== 'string') return undefined;
  if (!/^https?:\/\//i.test(apiUrl)) return undefined;

  try {
    const url = new URL(apiUrl);
    return url.origin;
  } catch {
    return undefined;
  }
}
