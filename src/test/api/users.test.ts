import { it, vi, expect, describe, beforeEach } from 'vitest';

import * as client from 'src/api/client';
import { getUsers, createUser, updateUser, deleteUser, patchUserStatus } from 'src/api/users';

// ----------------------------------------------------------------------

beforeEach(() => {
  vi.spyOn(client, 'apiFetch');
});

// ----------------------------------------------------------------------

describe('getUsers', () => {
  it('calls /users without params when no query is provided', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({ data: [] });

    await getUsers();

    expect(client.apiFetch).toHaveBeenCalledWith('/users');
  });

  it('appends query params to the URL', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({ data: [] });

    await getUsers({ page: 2, limit: 10, search: 'alice' });

    const called = (client.apiFetch as ReturnType<typeof vi.spyOn>).mock.calls[0][0] as string;
    expect(called).toContain('page=2');
    expect(called).toContain('limit=10');
    expect(called).toContain('search=alice');
  });

  it('omits undefined query params', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({ data: [] });

    await getUsers({ page: 1, status: undefined });

    const called = (client.apiFetch as ReturnType<typeof vi.spyOn>).mock.calls[0][0] as string;
    expect(called).not.toContain('status=');
  });
});

// ----------------------------------------------------------------------

describe('createUser', () => {
  it('posts to /users with payload', async () => {
    const newUser = { id: '100', name: 'Alice', email: 'alice@test.com', role: 'user', status: 'active', isVerified: false };
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce(newUser);

    const result = await createUser({ email: 'alice@test.com', password: 'pass', role: 'user', name: 'Alice' });

    expect(client.apiFetch).toHaveBeenCalledWith(
      '/users',
      expect.objectContaining({ method: 'POST' })
    );
    expect(result).toEqual(newUser);
  });
});

// ----------------------------------------------------------------------

describe('updateUser', () => {
  it('sends PUT to /users/:id', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({ id: '1', name: 'Updated', email: 'a@b.com', role: 'user', status: 'active', isVerified: true });

    await updateUser('1', { name: 'Updated' });

    expect(client.apiFetch).toHaveBeenCalledWith(
      '/users/1',
      expect.objectContaining({ method: 'PUT' })
    );
  });
});

// ----------------------------------------------------------------------

describe('patchUserStatus', () => {
  it('sends PATCH to /users/:id/status', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce(undefined);

    await patchUserStatus('42', 'inactive');

    expect(client.apiFetch).toHaveBeenCalledWith(
      '/users/42/status',
      expect.objectContaining({ method: 'PATCH' })
    );
  });
});

// ----------------------------------------------------------------------

describe('deleteUser', () => {
  it('sends DELETE to /users/:id', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce(undefined);

    await deleteUser('99');

    expect(client.apiFetch).toHaveBeenCalledWith(
      '/users/99',
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});
