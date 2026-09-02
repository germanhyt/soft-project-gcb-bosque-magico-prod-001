import axios from 'axios';

function traducirMensajeTecnico(raw: string): string {
  const texto = raw.trim();
  if (!texto) return '';
  if (/should not exist/i.test(texto)) {
    if (/precioDerecho|precioSalita/i.test(texto)) {
      return 'No se pudo aplicar el monto editado de un extra. Recarga la página e inténtalo de nuevo.';
    }
    return 'Hay un dato que no se pudo aplicar. Recarga la página e inténtalo de nuevo.';
  }
  if (/must be a number|must be an integer/i.test(texto)) {
    return 'Indica un número válido.';
  }
  return texto;
}

export function apiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const raw = err.response?.data?.message;
    if (typeof raw === 'string' && raw.trim()) return traducirMensajeTecnico(raw);
    if (Array.isArray(raw)) {
      const joined = raw.map((item) => traducirMensajeTecnico(String(item))).filter(Boolean).join(' ');
      if (joined) return joined;
    }
  }
  if (err instanceof Error && err.message.trim()) return traducirMensajeTecnico(err.message);
  return fallback;
}
