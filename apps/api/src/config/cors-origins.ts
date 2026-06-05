export function parseCorsOrigins(raw?: string): string[] {
  return (raw ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

export function isLocalDevOrigin(origin: string | undefined): boolean {
  return !origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}

export function isAllowedCorsOrigin(
  origin: string | undefined,
  allowedOrigins: string[],
): boolean {
  return isLocalDevOrigin(origin) || Boolean(origin && allowedOrigins.includes(origin));
}
