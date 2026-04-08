import { it, vi, expect, describe, beforeEach } from 'vitest';

import * as client from 'src/api/client';
import {
  getMedia,
  createMedia,
  updateMedia,
  deleteMedia,
  getMediaById,
  getMediaCategories,
} from 'src/api/media';

// ----------------------------------------------------------------------

beforeEach(() => {
  vi.spyOn(client, 'apiFetch');
});

// ----------------------------------------------------------------------

describe('getMedia', () => {
  it('calls /media without query string when no filters', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({ data: [] });

    await getMedia();

    expect(client.apiFetch).toHaveBeenCalledWith('/media');
  });

  it('appends filters as query params', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({ data: [] });

    await getMedia({ mediaType: 'video', page: 1, limit: 20 });

    const called = (client.apiFetch as ReturnType<typeof vi.spyOn>).mock.calls[0][0] as string;
    expect(called).toContain('mediaType=video');
    expect(called).toContain('page=1');
    expect(called).toContain('limit=20');
  });

  it('omits undefined values from query', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({ data: [] });

    await getMedia({ mediaType: 'audio', category: undefined });

    const called = (client.apiFetch as ReturnType<typeof vi.spyOn>).mock.calls[0][0] as string;
    expect(called).not.toContain('category=');
  });
});

// ----------------------------------------------------------------------

describe('createMedia', () => {
  it('posts to /media with the payload', async () => {
    const payload = {
      title: 'Test Video',
      mediaType: 'video' as const,
      menu: 'LiveTv' as const,
      fileUrl: 'https://cdn.example.com/vid.mp4',
      categories: ['cat-id-1', 'cat-id-2'],
    };
    const created = { id: 'media-1', ...payload, status: 'processing' as const };
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce(created);

    const result = await createMedia(payload);

    expect(client.apiFetch).toHaveBeenCalledWith(
      '/media',
      expect.objectContaining({ method: 'POST' })
    );
    expect(result).toMatchObject({ title: 'Test Video' });
  });
});

// ----------------------------------------------------------------------

describe('getMediaById', () => {
  it('calls GET /media/:id', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({ id: 'abc' });

    await getMediaById('abc');

    expect(client.apiFetch).toHaveBeenCalledWith('/media/abc');
  });
});

// ----------------------------------------------------------------------

describe('updateMedia', () => {
  it('sends PUT to /media/:id', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({});

    await updateMedia('media-5', { title: 'Renamed' });

    expect(client.apiFetch).toHaveBeenCalledWith(
      '/media/media-5',
      expect.objectContaining({ method: 'PUT' })
    );
  });
});

// ----------------------------------------------------------------------

describe('deleteMedia', () => {
  it('sends DELETE to /media/:id', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce(undefined);

    await deleteMedia('media-99');

    expect(client.apiFetch).toHaveBeenCalledWith(
      '/media/media-99',
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});

// ----------------------------------------------------------------------

describe('getMediaCategories', () => {
  it('calls GET /media/categories', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce([]);

    await getMediaCategories();

    expect(client.apiFetch).toHaveBeenCalledWith(
      '/media/categories',
      expect.objectContaining({ auth: false })
    );
  });
});
