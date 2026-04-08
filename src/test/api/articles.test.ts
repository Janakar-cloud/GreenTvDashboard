import { it, vi, expect, describe, beforeEach } from 'vitest';

import * as client from 'src/api/client';
import {
  getArticle,
  getArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  patchArticleStatus,
} from 'src/api/articles';

// ----------------------------------------------------------------------

beforeEach(() => {
  vi.spyOn(client, 'apiFetch');
});

// ----------------------------------------------------------------------

describe('getArticles', () => {
  it('calls GET /articles without params by default', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({ items: [], total: 0 });

    await getArticles();

    expect(client.apiFetch).toHaveBeenCalledWith('/articles');
  });

  it('appends query params when provided', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({ items: [], total: 0 });

    await getArticles({ status: 'published', page: 2, pageSize: 10, search: 'eco' });

    const url = (client.apiFetch as ReturnType<typeof vi.spyOn>).mock.calls[0][0] as string;
    expect(url).toContain('status=published');
    expect(url).toContain('page=2');
    expect(url).toContain('pageSize=10');
    expect(url).toContain('search=eco');
  });
});

// ----------------------------------------------------------------------

describe('getArticle', () => {
  it('calls GET /articles/:id', async () => {
    const article = { id: 'art1', title: 'Eco Article' };
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce(article);

    const result = await getArticle('art1');

    expect(client.apiFetch).toHaveBeenCalledWith('/articles/art1');
    expect(result).toMatchObject({ title: 'Eco Article' });
  });
});

// ----------------------------------------------------------------------

describe('createArticle', () => {
  it('sends POST to /articles with payload', async () => {
    const payload = { title: 'New Article', bodyMd: '# Hello', status: 'draft' as const };
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({ id: 'new-art', ...payload });

    await createArticle(payload);

    expect(client.apiFetch).toHaveBeenCalledWith(
      '/articles',
      expect.objectContaining({ method: 'POST' })
    );
  });
});

// ----------------------------------------------------------------------

describe('updateArticle', () => {
  it('sends PUT to /articles/:id with partial payload', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({ id: 'art1', title: 'Updated Title' });

    await updateArticle('art1', { title: 'Updated Title' });

    expect(client.apiFetch).toHaveBeenCalledWith(
      '/articles/art1',
      expect.objectContaining({ method: 'PUT' })
    );
  });
});

// ----------------------------------------------------------------------

describe('deleteArticle', () => {
  it('sends DELETE to /articles/:id', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce(undefined);

    await deleteArticle('art1');

    expect(client.apiFetch).toHaveBeenCalledWith(
      '/articles/art1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});

// ----------------------------------------------------------------------

describe('patchArticleStatus', () => {
  it('sends PATCH to /articles/:id/status with published', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({ status: 'published' });

    await patchArticleStatus('art1', 'published');

    expect(client.apiFetch).toHaveBeenCalledWith(
      '/articles/art1/status',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'published' }),
      })
    );
  });

  it('sends PATCH with draft status', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({ status: 'draft' });

    await patchArticleStatus('art2', 'draft');

    const opts = (client.apiFetch as ReturnType<typeof vi.spyOn>).mock.calls[0][1] as RequestInit;
    expect(JSON.parse(opts.body as string)).toEqual({ status: 'draft' });
  });
});
