import axios from 'axios';

export function apiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const raw = err.response?.data?.message;
    if (typeof raw === 'string' && raw.trim()) return raw;
    if (Array.isArray(raw)) {
      const joined = raw.map(String).filter(Boolean).join(', ');
      if (joined) return joined;
    }
  }
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
}
