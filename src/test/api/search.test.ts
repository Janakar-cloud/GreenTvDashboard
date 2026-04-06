import { it, vi, expect, describe, beforeEach } from 'vitest';

import * as client from 'src/api/client';
import { globalSearch } from 'src/api/search';

// ----------------------------------------------------------------------

beforeEach(() => {
  vi.spyOn(client, 'apiFetch');
});

// ----------------------------------------------------------------------

describe('globalSearch', () => {
  it('calls GET /search with query param', async () => {
    const mockResponse = { query: 'sanatan', results: { media: [], articles: [] }, totalResults: 0 };
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce(mockResponse);

    await globalSearch({ q: 'sanatan' });

    const url = (client.apiFetch as ReturnType<typeof vi.spyOn>).mock.calls[0][0] as string;
    expect(url).toContain('/search?');
    expect(url).toContain('q=sanatan');
  });

  it('appends type and limit params when provided', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({ query: 'eco', results: { media: [], articles: [] }, totalResults: 0 });

    await globalSearch({ q: 'eco', type: 'media', limit: 5 });

    const url = (client.apiFetch as ReturnType<typeof vi.spyOn>).mock.calls[0][0] as string;
    expect(url).toContain('type=media');
    expect(url).toContain('limit=5');
  });

  it('returns results with media and articles arrays', async () => {
    const mediaItems = [{ id: 'v1', type: 'video', title: 'Eco Talk', description: '' }];
    const mockResponse = {
      query: 'eco',
      results: { media: mediaItems, articles: [] },
      totalResults: 1,
    };
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce(mockResponse);

    const result = await globalSearch({ q: 'eco' });

    expect(result.results.media).toHaveLength(1);
    expect(result.results.media[0].title).toBe('Eco Talk');
    expect(result.totalResults).toBe(1);
  });

  it('returns empty results when nothing matches', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({
      query: 'xyznotfound',
      results: { media: [], articles: [] },
      totalResults: 0,
    });

    const result = await globalSearch({ q: 'xyznotfound' });

    expect(result.results.media).toHaveLength(0);
    expect(result.results.articles).toHaveLength(0);
    expect(result.totalResults).toBe(0);
  });

  it('throws when API call fails', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockRejectedValueOnce(new Error('Search failed'));

    await expect(globalSearch({ q: 'test' })).rejects.toThrow('Search failed');
  });
});
