import { api } from './api';
import { setStoredSession, type PanelUser } from './auth-storage';

export type { PanelUser } from './auth-storage';

export type LoginResponse = {
  accessToken: string;
  user: PanelUser;
};

export { clearSession, getStoredToken, getStoredUser } from './auth-storage';
import { getStoredToken } from './auth-storage';

export async function fetchAuthStatus() {
  const { data } = await api.get<{ authRequired: boolean }>('/auth/status');
  return data;
}

export async function login(email: string, password: string) {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
  setStoredSession(data.accessToken, data.user);
  return data;
}

export async function fetchMe() {
  const { data } = await api.get<PanelUser>('/auth/me');
  const token = getStoredToken();
  if (token) setStoredSession(token, data);
  return data;
}
