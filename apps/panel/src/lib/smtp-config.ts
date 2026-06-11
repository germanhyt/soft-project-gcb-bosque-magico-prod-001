import type { ConfigItem } from './configuracion';

export type SmtpEstadoPanel = {
  habilitado: boolean;
  activo: boolean;
};

/** Valores por defecto alineados con `apps/api/prisma/seed.ts`. */
export const SMTP_DEFAULTS: Record<string, string> = {
  'smtp.habilitado': 'false',
  'smtp.host': '',
  'smtp.port': '587',
  'smtp.user': '',
  'smtp.password': '',
  'smtp.from_email': 'no-reply@bosquemagico.test',
  'smtp.from_name': 'Bosque Magico',
  'smtp.secure': 'false',
};

export const SMTP_CLAVES = Object.keys(SMTP_DEFAULTS);

export const SMTP_ORDEN = [
  'smtp.habilitado',
  'smtp.host',
  'smtp.port',
  'smtp.user',
  'smtp.password',
  'smtp.from_email',
  'smtp.from_name',
  'smtp.secure',
] as const;

export function smtpValoresDesdeItems(items: ConfigItem[] | undefined): Record<string, string> {
  const map = { ...SMTP_DEFAULTS };
  for (const item of items ?? []) {
    if (!item.clave.startsWith('smtp.')) continue;
    if (typeof item.valor === 'boolean') {
      map[item.clave] = item.valor ? 'true' : 'false';
    } else if (typeof item.valor === 'number') {
      map[item.clave] = String(item.valor);
    } else {
      map[item.clave] = String(item.valor ?? '');
    }
  }
  return map;
}

export function parseSmtpEstado(items: ConfigItem[] | undefined): SmtpEstadoPanel {
  const valores = smtpValoresDesdeItems(items);
  const habilitado = valores['smtp.habilitado'] === 'true';
  const host = valores['smtp.host'].trim();
  return { habilitado, activo: habilitado && host.length > 0 };
}
