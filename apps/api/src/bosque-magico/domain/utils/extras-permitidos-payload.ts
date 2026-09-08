import {
  nombresExtrasPermitidosDesdeCatalogo,
  normalizarExtrasPermitidos,
} from './extras-permitidos';
import type { Prisma } from '@prisma/client';

export function payloadExtrasPermitidos(params: {
  lista?: string[];
  comentario?: string;
  catalogo?: Array<{
    extraPermitido?: boolean | null;
    codigo?: string | null;
    nombre: string;
    etapa?: string | null;
  }>;
  usarDefaultSiOmite?: boolean;
}): {
  extrasPermitidos?: Prisma.InputJsonValue;
  extrasPermitidosComentario?: string | null;
} {
  const out: {
    extrasPermitidos?: Prisma.InputJsonValue;
    extrasPermitidosComentario?: string | null;
  } = {};

  if (params.lista !== undefined) {
    out.extrasPermitidos = normalizarExtrasPermitidos(params.lista);
  } else if (params.usarDefaultSiOmite) {
    out.extrasPermitidos = nombresExtrasPermitidosDesdeCatalogo(params.catalogo);
  }

  if (params.comentario !== undefined) {
    out.extrasPermitidosComentario = params.comentario.trim() || null;
  }

  return out;
}
