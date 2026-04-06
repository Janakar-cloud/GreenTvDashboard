import { it, vi, expect, describe, beforeEach } from 'vitest';

import * as client from 'src/api/client';
import {
  getEngageStats,
  getTrending,
  getLatest,
  getLogs,
  deleteLogs,
} from 'src/api/engage';

// ----------------------------------------------------------------------

beforeEach(() => {
  vi.spyOn(client, 'apiFetch');
});

// ----------------------------------------------------------------------

describe('getEngageStats', () => {
  it('calls GET /engage/stats/:type/:id', async () => {
    const stats = { views: 42, likes: 5, commentsCount: 3 };
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce(stats);

    const result = await getEngageStats('video', 'abc123');

    expect(client.apiFetch).toHaveBeenCalledWith('/engage/stats/video/abc123');
    expect(result).toEqual(stats);
  });

  it('works for podcast type', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({ views: 10, likes: 2, commentsCount: 0 });

    await getEngageStats('podcast', 'pod-999');

    expect(client.apiFetch).toHaveBeenCalledWith('/engage/stats/podcast/pod-999');
  });
});

// ----------------------------------------------------------------------

describe('getTrending', () => {
  it('calls GET /engage/trending without params when none given', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({ items: [], total: 0 });

    await getTrending();

    expect(client.apiFetch).toHaveBeenCalledWith('/engage/trending');
  });

  it('appends query params when provided', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({ items: [], total: 0 });

    await getTrending({ type: 'video', limit: 5, days: 14 });

    const url = (client.apiFetch as ReturnType<typeof vi.spyOn>).mock.calls[0][0] as string;
    expect(url).toContain('type=video');
    expect(url).toContain('limit=5');
    expect(url).toContain('days=14');
  });

  it('returns items array', async () => {
    const items = [{ _id: '1', title: 'Hot Video', views: 1000, likes: 50, commentsCount: 2, _type: 'video' as const }];
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({ items, total: 1 });

    const result = await getTrending({ type: 'all', limit: 10 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe('Hot Video');
  });
});

// ----------------------------------------------------------------------

describe('getLatest', () => {
  it('calls GET /engage/latest without params when none given', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({ items: [], total: 0 });

    await getLatest();

    expect(client.apiFetch).toHaveBeenCalledWith('/engage/latest');
  });

  it('appends type and limit params', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({ items: [], total: 0 });

    await getLatest({ type: 'podcast', limit: 3 });

    const url = (client.apiFetch as ReturnType<typeof vi.spyOn>).mock.calls[0][0] as string;
    expect(url).toContain('type=podcast');
    expect(url).toContain('limit=3');
  });
});

// ----------------------------------------------------------------------

describe('getLogs', () => {
  it('calls GET /logs without params by default', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({ data: [], meta: { page: 1, limit: 20, total: 0 } });

    await getLogs();

    expect(client.apiFetch).toHaveBeenCalledWith('/logs');
  });

  it('appends filter params', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({ data: [], meta: { page: 1, limit: 20, total: 0 } });

    await getLogs({ level: 'error', source: 'auth', page: 2, limit: 50 });

    const url = (client.apiFetch as ReturnType<typeof vi.spyOn>).mock.calls[0][0] as string;
    expect(url).toContain('level=error');
    expect(url).toContain('source=auth');
    expect(url).toContain('page=2');
    expect(url).toContain('limit=50');
  });

  it('returns paginated response', async () => {
    const mockData = { data: [{ _id: 'l1', level: 'info', message: 'test', createdAt: '2026-01-01' }], meta: { page: 1, limit: 20, total: 1 } };
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce(mockData);

    const result = await getLogs();

    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });
});

// ----------------------------------------------------------------------

describe('deleteLogs', () => {
  it('calls DELETE /logs with olderThanDays param', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({ deleted: 5 });

    const result = await deleteLogs({ olderThanDays: 30 });

    const url = (client.apiFetch as ReturnType<typeof vi.spyOn>).mock.calls[0][0] as string;
    expect(url).toContain('olderThanDays=30');
    expect(result).toMatchObject({ deleted: 5 });
  });

  it('calls DELETE /logs with level param', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({ deleted: 2 });

    await deleteLogs({ level: 'debug' });

    const url = (client.apiFetch as ReturnType<typeof vi.spyOn>).mock.calls[0][0] as string;
    expect(url).toContain('level=debug');
  });
});
