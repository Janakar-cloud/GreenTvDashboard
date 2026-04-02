import { it, vi, expect, describe, beforeEach } from 'vitest';

import * as client from 'src/api/client';
import { getHomeFeed, getDashboardSummary } from 'src/api/dashboard';

// ----------------------------------------------------------------------

beforeEach(() => {
  vi.spyOn(client, 'apiFetch');
});

// ----------------------------------------------------------------------

describe('getHomeFeed', () => {
  it('calls GET /home without auth', async () => {
    const feed = { media: [], articles: [] };
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce(feed);

    const result = await getHomeFeed();

    expect(client.apiFetch).toHaveBeenCalledWith(
      '/home',
      expect.objectContaining({ auth: false })
    );
    expect(result).toEqual(feed);
  });
});

// ----------------------------------------------------------------------

describe('getDashboardSummary', () => {
  it('calls GET /dashboard/summary', async () => {
    const summary = {
      metrics: { numberOfVideo: 5, totalUsers: 100, onlineUsers: 10, totalPodcasts: 3 },
    };
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce(summary);

    const result = await getDashboardSummary();

    expect(client.apiFetch).toHaveBeenCalledWith('/admin/summary');
    expect(result).toMatchObject({ metrics: expect.any(Object) });
  });

  it('appends date range params when provided', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({});

    await getDashboardSummary({ from: '2024-01-01', to: '2024-12-31', interval: 'month' });

    const called = (client.apiFetch as ReturnType<typeof vi.spyOn>).mock.calls[0][0] as string;
    expect(called).toContain('from=');
    expect(called).toContain('to=');
    expect(called).toContain('interval=month');
    expect(called).toContain('/admin/summary');
  });
});
