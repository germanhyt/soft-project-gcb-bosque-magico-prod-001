import { api } from './api';
import { linkMailto } from './contacto-links';

export type EnviarCorreoContactoPayload = {
  correoDestino: string;
  asunto: string;
  cuerpo: string;
  archivos?: File[];
};

export type EnviarCorreoContactoResponse = {
  enviadoPorSmtp: boolean;
  correoDestino: string;
  correoAsunto: string;
  correoCuerpo: string;
};

export async function enviarCorreoContactoApi(
  payload: EnviarCorreoContactoPayload,
) {
  const { correoDestino, asunto, cuerpo, archivos } = payload;
  if (archivos?.length) {
    const fd = new FormData();
    fd.append('correoDestino', correoDestino);
    fd.append('asunto', asunto);
    fd.append('cuerpo', cuerpo);
    for (const file of archivos) fd.append('adjuntos', file);
    const { data } = await api.post<EnviarCorreoContactoResponse>(
      '/bosque-magico/contacto/correo',
      fd,
    );
    return data;
  }
  const { data } = await api.post<EnviarCorreoContactoResponse>(
    '/bosque-magico/contacto/correo',
    { correoDestino, asunto, cuerpo },
  );
  return data;
}

export function abrirClienteCorreo(correo: string, asunto: string, cuerpo: string) {
  const url = linkMailto(correo, asunto, cuerpo);
  const a = document.createElement('a');
  a.href = url;
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
