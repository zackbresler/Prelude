import { apiGet, apiPost, apiPut, apiDelete } from './client';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  approved: boolean;
  createdAt: string;
  updatedAt: string;
  projectCount: number;
}

interface UsersResponse {
  users: AdminUser[];
}

interface UserResponse {
  user: AdminUser;
}

export async function listUsers(): Promise<AdminUser[]> {
  const { users } = await apiGet<UsersResponse>('/api/admin/users');
  return users;
}

export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  role?: 'USER' | 'ADMIN';
}): Promise<AdminUser> {
  const { user } = await apiPost<UserResponse>('/api/admin/users', data);
  return user;
}

export async function updateUser(
  id: string,
  data: {
    email?: string;
    password?: string;
    name?: string;
    role?: 'USER' | 'ADMIN';
    approved?: boolean;
  }
): Promise<AdminUser> {
  const { user } = await apiPut<UserResponse>(`/api/admin/users/${id}`, data);
  return user;
}

export async function deleteUser(id: string): Promise<void> {
  await apiDelete(`/api/admin/users/${id}`);
}

export interface RestoreResult {
  message: string;
  usersImported: number;
  usersSkipped: number;
  projectsImported: number;
  projectsSkipped: number;
}

export async function downloadBackup(): Promise<void> {
  const response = await fetch('/api/admin/backup', {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to download backup');
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const filename = response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1]
    || `prelude-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function restoreBackup(file: File): Promise<RestoreResult> {
  const text = await file.text();
  const data = JSON.parse(text);
  const response = await fetch('/api/admin/restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to restore backup');
  }
  return response.json();
}
