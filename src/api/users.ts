import { apiFetch } from './client';

export type UserItem = {
  id: string;
  name: string;
  email?: string;
  role: string;
  status: string;
  isVerified: boolean;
  avatarUrl?: string | null;
};

export type UsersResponse = {
  data: UserItem[];
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
};

export type UsersQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
  sort?: string;
  order?: 'asc' | 'desc';
};

export async function getUsers(params: UsersQuery = {}) {
  const query = new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => [key, String(value)])
  );

  const qs = query.toString();
  return apiFetch<UsersResponse | UserItem[]>(qs ? `/users?${qs}` : '/users');
}

export async function createUser(payload: {
  email: string;
  password: string;
  role: string;
  name?: string;
  status?: string;
}) {
  return apiFetch<UserItem>('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateUser(id: string, payload: Partial<Omit<UserItem, 'id'>>) {
  return apiFetch<UserItem>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function patchUserStatus(id: string, status: string) {
  return apiFetch<UserItem>(`/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function deleteUser(id: string) {
  await apiFetch<void>(`/users/${id}`, {
    method: 'DELETE',
  });
}
