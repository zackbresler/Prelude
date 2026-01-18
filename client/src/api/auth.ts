import { apiGet, apiPost, apiPut } from './client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
}

interface LoginResponse {
  user: User;
}

interface MeResponse {
  user: User;
}

export async function login(email: string, password: string): Promise<User> {
  const { user } = await apiPost<LoginResponse>('/api/auth/login', { email, password });
  return user;
}

export async function logout(): Promise<void> {
  await apiPost('/api/auth/logout');
}

export async function getMe(): Promise<User | null> {
  try {
    const { user } = await apiGet<MeResponse>('/api/auth/me');
    return user;
  } catch {
    return null;
  }
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiPut('/api/auth/change-password', { currentPassword, newPassword });
}
