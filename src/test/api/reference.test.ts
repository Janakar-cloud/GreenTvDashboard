import { it, vi, expect, describe, beforeEach } from 'vitest';

import * as client from 'src/api/client';
import {
  getTags,
  getMenus,
  createTag,
  deleteTag,
  getCategories,
} from 'src/api/reference';

// ----------------------------------------------------------------------

beforeEach(() => {
  vi.spyOn(client, 'apiFetch');
});

// ----------------------------------------------------------------------

describe('getCategories', () => {
  it('calls GET /api/categories without type filter', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce(['News', 'Sports']);

    const result = await getCategories();

    expect(client.apiFetch).toHaveBeenCalledWith('/api/categories', expect.objectContaining({ auth: false }));
    expect(result).toEqual(['News', 'Sports']);
  });

  it('appends type query param when provided', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce(['Science']);

    await getCategories('article');

    const url = (client.apiFetch as ReturnType<typeof vi.spyOn>).mock.calls[0][0] as string;
    expect(url).toContain('type=article');
  });
});

// ----------------------------------------------------------------------

describe('getMenus', () => {
  it('returns data array when response has data field', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({ data: ['LiveTv', 'Podcast', 'News'] });

    const result = await getMenus();

    expect(client.apiFetch).toHaveBeenCalledWith('/api/menus', expect.objectContaining({ auth: false }));
    expect(result).toEqual(['LiveTv', 'Podcast', 'News']);
  });

  it('returns default menus when API fails', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockRejectedValueOnce(new Error('Network error'));

    const result = await getMenus();

    expect(result).toEqual(['LiveTv', 'Podcast']);
  });
});

// ----------------------------------------------------------------------

describe('getTags', () => {
  it('calls GET /api/tags without type filter', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce([{ _id: 't1', name: 'Eco', kind: 'category' }]);

    await getTags();

    expect(client.apiFetch).toHaveBeenCalledWith('/api/tags', expect.objectContaining({ auth: false }));
  });

  it('appends type filter when provided', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce([]);

    await getTags('media');

    const url = (client.apiFetch as ReturnType<typeof vi.spyOn>).mock.calls[0][0] as string;
    expect(url).toContain('type=media');
  });
});

// ----------------------------------------------------------------------

describe('createTag', () => {
  it('sends POST to /tags with name and kind fields', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({ _id: 'new-tag', name: 'Green', kind: 'category' });

    await createTag('Green');

    expect(client.apiFetch).toHaveBeenCalledWith(
      '/tags',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Green', kind: 'category' }),
      })
    );
  });

  it('uses provided type as kind', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({ _id: 'new', name: 'Topic1', kind: 'topic' });

    await createTag('Topic1', 'topic');

    expect(client.apiFetch).toHaveBeenCalledWith(
      '/tags',
      expect.objectContaining({
        body: JSON.stringify({ name: 'Topic1', kind: 'topic' }),
      })
    );
  });
});

// ----------------------------------------------------------------------

describe('deleteTag', () => {
  it('sends DELETE to /tags/:id', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce(undefined);

    await deleteTag('tag-abc');

    expect(client.apiFetch).toHaveBeenCalledWith(
      '/tags/tag-abc',
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});
