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
