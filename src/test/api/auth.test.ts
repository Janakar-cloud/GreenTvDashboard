import { it, vi, expect, describe, beforeEach } from 'vitest';

import * as client from 'src/api/client';
import { getMe, login, register, logoutApi, getStoredUser } from 'src/api/auth';

// ----------------------------------------------------------------------

beforeEach(() => {
  vi.spyOn(client, 'apiFetch');
  vi.spyOn(client, 'setTokens');
  vi.spyOn(client, 'clearTokens');
});

// ----------------------------------------------------------------------

describe('login', () => {
  it('calls /auth/login with email and password', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({
      accessToken: 'acc-token',
      refreshToken: 'ref-token',
      user: { id: '1', name: 'Alice', email: 'alice@example.com', role: 'admin' },
    });

    await login('alice@example.com', 'secret');

    expect(client.apiFetch).toHaveBeenCalledWith(
      '/auth/login',
      expect.objectContaining({ method: 'POST', auth: false })
    );
  });

  it('stores tokens when login succeeds', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({
      accessToken: 'acc-token',
      refreshToken: 'ref-token',
    });

    await login('user@test.com', 'pass');

    expect(client.setTokens).toHaveBeenCalledWith('acc-token', 'ref-token');
  });

  it('stores tokens when login response is wrapped in data', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({
      data: {
        accessToken: 'wrapped-acc',
        refreshToken: 'wrapped-ref',
      },
    });

    await login('user@test.com', 'pass');

    expect(client.setTokens).toHaveBeenCalledWith('wrapped-acc', 'wrapped-ref');
  });

  it('stores user in localStorage when present', async () => {
    const user = { id: '2', name: 'Bob', email: 'bob@test.com', role: 'user' };
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({
      accessToken: 'a',
      refreshToken: 'r',
      user,
    });

    await login('bob@test.com', 'pass');

    const stored = localStorage.getItem('currentUser');
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!)).toMatchObject({ email: 'bob@test.com' });
  });

  it('throws when API call fails', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockRejectedValueOnce(
      new Error('Invalid credentials')
    );

    await expect(login('bad@test.com', 'wrong')).rejects.toThrow('Invalid credentials');
  });
});

// ----------------------------------------------------------------------

describe('register', () => {
  it('calls /auth/register with email, password, and name', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({});

    await register('new@test.com', 'pass123', 'New User');

    expect(client.apiFetch).toHaveBeenCalledWith(
      '/auth/register',
      expect.objectContaining({ method: 'POST', auth: false })
    );
  });
});

// ----------------------------------------------------------------------

describe('getStoredUser', () => {
  it('returns null when nothing is stored', () => {
    expect(getStoredUser()).toBeNull();
  });

  it('returns the stored user object', () => {
    const user = { id: '5', name: 'Eve', email: 'eve@test.com', role: 'admin' };
    localStorage.setItem('currentUser', JSON.stringify(user));
    expect(getStoredUser()).toMatchObject({ email: 'eve@test.com' });
  });

  it('returns null when stored value is malformed JSON', () => {
    localStorage.setItem('currentUser', '{bad json}');
    expect(getStoredUser()).toBeNull();
  });
});

// ----------------------------------------------------------------------

describe('getMe', () => {
  it('returns profile when /auth/me payload is wrapped in data', async () => {
    const profile = {
      user: { id: '2', name: 'Bob', email: 'bob@test.com', role: 'user' },
      app: {},
    };
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({ data: profile });

    const result = await getMe();

    expect(result).toMatchObject(profile);
    expect(JSON.parse(localStorage.getItem('currentUser') || '{}')).toMatchObject(profile.user);
  });
});

// ----------------------------------------------------------------------

describe('logoutApi', () => {
  it('calls /auth/logout with POST', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce(undefined);

    await logoutApi('refresh-token-abc');

    expect(client.apiFetch).toHaveBeenCalledWith(
      '/auth/logout',
      expect.objectContaining({ method: 'POST' })
    );
  });
});
