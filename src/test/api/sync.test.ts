import { it, vi, expect, describe, beforeEach } from 'vitest';

import * as client from 'src/api/client';
import { triggerS3Sync, getSyncDiagnosis } from 'src/api/sync';

// ----------------------------------------------------------------------

beforeEach(() => {
  vi.spyOn(client, 'apiFetch');
});

// ----------------------------------------------------------------------

describe('triggerS3Sync', () => {
  it('sends POST to /sync/s3', async () => {
    const syncResult = {
      durationMs: 1200,
      videos: { added: 2, updated: 1 },
      podcasts: { added: 0, updated: 0 },
      removed: { videos: 0, podcasts: 0 },
    };
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce(syncResult);

    const result = await triggerS3Sync();

    expect(client.apiFetch).toHaveBeenCalledWith(
      '/sync/s3',
      expect.objectContaining({ method: 'POST' })
    );
    expect(result.durationMs).toBe(1200);
    expect(result.videos.added).toBe(2);
  });

  it('throws when sync fails', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockRejectedValueOnce(new Error('S3 bucket not found'));

    await expect(triggerS3Sync()).rejects.toThrow('S3 bucket not found');
  });
});

// ----------------------------------------------------------------------

describe('getSyncDiagnosis', () => {
  it('calls GET /sync/diagnose', async () => {
    const diagnosis = {
      s3: { videos: 10, podcasts: 5 },
      db: { videos: 9, podcasts: 5 },
      diff: { videosOnlyInS3: ['vid-new'], podcastsOnlyInS3: [], videosOnlyInDb: [], podcastsOnlyInDb: [] },
    };
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce(diagnosis);

    const result = await getSyncDiagnosis();

    expect(client.apiFetch).toHaveBeenCalledWith('/sync/diagnose');
    expect(result.diff.videosOnlyInS3).toHaveLength(1);
  });
});
