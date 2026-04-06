import { it, vi, expect, describe, beforeEach } from 'vitest';

import * as client from 'src/api/client';
import {
  getPodcastComments,
  addPodcastComment,
  patchPodcastCommentStatus,
  deletePodcastComment,
} from 'src/api/podcasts';

// ----------------------------------------------------------------------

beforeEach(() => {
  vi.spyOn(client, 'apiFetch');
});

// ----------------------------------------------------------------------

describe('getPodcastComments', () => {
  it('calls GET /podcasts/:id/comments for public (hidden=false)', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce([]);

    await getPodcastComments('pod1');

    const url = (client.apiFetch as ReturnType<typeof vi.spyOn>).mock.calls[0][0] as string;
    expect(url).toContain('/podcasts/pod1/comments');
    expect(url).not.toContain('/all');
  });

  it('calls admin endpoint /comments/all when includeHidden=true', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce([]);

    await getPodcastComments('pod1', true);

    const url = (client.apiFetch as ReturnType<typeof vi.spyOn>).mock.calls[0][0] as string;
    expect(url).toContain('/podcasts/pod1/comments/all');
  });
});

// ----------------------------------------------------------------------

describe('addPodcastComment', () => {
  it('sends POST to /podcasts/:id/comments', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({ id: 'c1', message: 'Great!' });

    await addPodcastComment('pod1', { author: 'Alice', message: 'Great!' });

    expect(client.apiFetch).toHaveBeenCalledWith(
      '/podcasts/pod1/comments',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ author: 'Alice', message: 'Great!' }),
      })
    );
  });

  it('includes parentCommentId when replying', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({ id: 'c2' });

    await addPodcastComment('pod1', { author: 'Bob', message: 'Reply!', parentCommentId: 'c1' });

    const opts = (client.apiFetch as ReturnType<typeof vi.spyOn>).mock.calls[0][1] as RequestInit;
    const body = JSON.parse(opts.body as string);
    expect(body.parentCommentId).toBe('c1');
  });
});

// ----------------------------------------------------------------------

describe('patchPodcastCommentStatus', () => {
  it('sends PATCH to /podcasts/:podcastId/comments/:commentId/status', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({ status: 'hidden' });

    await patchPodcastCommentStatus('pod1', 'com1', 'hidden');

    expect(client.apiFetch).toHaveBeenCalledWith(
      '/podcasts/pod1/comments/com1/status',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'hidden' }),
      })
    );
  });
});

// ----------------------------------------------------------------------

describe('deletePodcastComment', () => {
  it('sends DELETE to /podcasts/:podcastId/comments/:commentId', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce(undefined);

    await deletePodcastComment('pod1', 'com1');

    expect(client.apiFetch).toHaveBeenCalledWith(
      '/podcasts/pod1/comments/com1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});
