const TOKEN_KEY = 'bm_panel_token';
const USER_KEY = 'bm_panel_user';

export type PanelUser = {
  id: string;
  email: string;
  nombre: string;
  permisos: string[];
};

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): PanelUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PanelUser;
  } catch {
    return null;
  }
}

export function setStoredSession(accessToken: string, user: PanelUser) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
