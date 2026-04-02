import { it, vi, expect, describe, beforeEach } from 'vitest';

import {
  apiFetch,
  setTokens,
  clearTokens,
  getAccessToken,
  getRefreshToken,
} from 'src/api/client';

// ----------------------------------------------------------------------
// Token management
// ----------------------------------------------------------------------

describe('getAccessToken', () => {
  it('returns null when no token is stored', () => {
    expect(getAccessToken()).toBeNull();
  });

  it('returns the stored access token', () => {
    localStorage.setItem('accessToken', 'my-access-token');
    expect(getAccessToken()).toBe('my-access-token');
  });
});

describe('getRefreshToken', () => {
  it('returns null when no token is stored', () => {
    expect(getRefreshToken()).toBeNull();
  });

  it('returns the stored refresh token', () => {
    localStorage.setItem('refreshToken', 'my-refresh-token');
    expect(getRefreshToken()).toBe('my-refresh-token');
  });
});

describe('setTokens', () => {
  it('stores accessToken in localStorage', () => {
    setTokens('access-123');
    expect(localStorage.getItem('accessToken')).toBe('access-123');
  });

  it('stores refreshToken in localStorage', () => {
    setTokens(undefined, 'refresh-999');
    expect(localStorage.getItem('refreshToken')).toBe('refresh-999');
  });

  it('stores both tokens when both provided', () => {
    setTokens('acc', 'ref');
    expect(localStorage.getItem('accessToken')).toBe('acc');
    expect(localStorage.getItem('refreshToken')).toBe('ref');
  });

  it('does not overwrite existing token when undefined is passed', () => {
    localStorage.setItem('accessToken', 'existing');
    setTokens(undefined, 'new-refresh');
    expect(localStorage.getItem('accessToken')).toBe('existing');
  });
});

describe('clearTokens', () => {
  it('removes both tokens from localStorage', () => {
    localStorage.setItem('accessToken', 'acc');
    localStorage.setItem('refreshToken', 'ref');
    clearTokens();
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });
});

// ----------------------------------------------------------------------
// apiFetch
// ----------------------------------------------------------------------

describe('apiFetch', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('calls fetch with correct URL', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ success: true }),
      clone () { return this; },
    };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockResponse);

    await apiFetch('/test-endpoint');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test-endpoint'),
      expect.any(Object)
    );
  });

  it('returns parsed JSON body on success', async () => {
    const payload = { id: 1, name: 'Test' };
    const mockResponse = {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => payload,
      clone () { return this; },
    };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockResponse);

    const result = await apiFetch('/items');
    expect(result).toEqual(payload);
  });

  it('returns undefined for 204 No Content', async () => {
    const mockResponse = {
      ok: true,
      status: 204,
      headers: { get: () => null },
      clone () { return this; },
    };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockResponse);

    const result = await apiFetch('/delete-item', { method: 'DELETE' });
    expect(result).toBeUndefined();
  });

  it('throws an error for non-ok response', async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      headers: { get: () => 'application/json' },
      json: async () => ({ message: 'Not found' }),
      clone () { return this; },
    };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockResponse);

    await expect(apiFetch('/missing')).rejects.toThrow('Not found');
  });

  it('attaches Authorization header when access token exists', async () => {
    localStorage.setItem('accessToken', 'bearer-token-xyz');
    const mockResponse = {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({}),
      clone () { return this; },
    };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockResponse);

    await apiFetch('/protected');

    const calledHeaders: Headers = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers;
    expect(calledHeaders.get('Authorization')).toBe('Bearer bearer-token-xyz');
  });

  it('does not attach Authorization header when auth:false', async () => {
    localStorage.setItem('accessToken', 'should-not-attach');
    const mockResponse = {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({}),
      clone () { return this; },
    };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockResponse);

    await apiFetch('/public', { auth: false });

    const calledHeaders: Headers = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers;
    expect(calledHeaders.get('Authorization')).toBeNull();
  });

  it('sets Content-Type application/json for JSON body', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({}),
      clone () { return this; },
    };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockResponse);

    await apiFetch('/submit', {
      method: 'POST',
      body: JSON.stringify({ key: 'value' }),
    });

    const calledHeaders: Headers = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers;
    expect(calledHeaders.get('Content-Type')).toBe('application/json');
  });
});
