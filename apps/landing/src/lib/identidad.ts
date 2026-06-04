import { api } from './api';

export type ResumenIdentidadPublica = {
  celularNormalizado: string;
  correoNormalizado: string | null;
  clienteId: string | null;
  clienteNombre: string | null;
  totalSolicitudes: number;
  solicitudesRecientes24h: boolean;
  primeraSolicitudEn: string | null;
  ultimaSolicitudEn: string | null;
};

export async function consultarIdentidad(celular: string, correo?: string) {
  const { data } = await api.get<ResumenIdentidadPublica>(
    '/public/bosque-magico/identidad',
    { params: { celular, correo: correo || undefined } },
  );
  return data;
}
