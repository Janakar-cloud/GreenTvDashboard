import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as client from 'src/api/client';
import {
  getLiveConfig,
  updateLiveConfig,
  getLivePlaylist,
  requestLiveAccess,
} from 'src/api/live';

// ----------------------------------------------------------------------

beforeEach(() => {
  vi.spyOn(client, 'apiFetch');
});

// ----------------------------------------------------------------------

describe('getLiveConfig', () => {
  it('calls GET /live/config without auth', async () => {
    const config = { streamUrl: 'rtmp://example.com/live', title: 'Live Show' };
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce(config);

    const result = await getLiveConfig();

    expect(client.apiFetch).toHaveBeenCalledWith(
      '/live/config',
      expect.objectContaining({ auth: false })
    );
    expect(result).toEqual(config);
  });
});

// ----------------------------------------------------------------------

describe('updateLiveConfig', () => {
  it('sends PUT to /live/config with payload', async () => {
    const payload = { streamUrl: 'rtmp://new.stream/live', title: 'Updated Show' };
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce(payload);

    const result = await updateLiveConfig(payload);

    expect(client.apiFetch).toHaveBeenCalledWith(
      '/live/config',
      expect.objectContaining({ method: 'PUT' })
    );
    expect(result).toMatchObject({ title: 'Updated Show' });
  });
});

// ----------------------------------------------------------------------

describe('getLivePlaylist', () => {
  it('calls GET /live/playlist', async () => {
    const playlist = { playlistUrl: 'https://cdn.example.com/hls/live.m3u8', status: 'active' };
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce(playlist);

    const result = await getLivePlaylist();

    expect(client.apiFetch).toHaveBeenCalledWith('/live/playlist');
    expect(result).toEqual(playlist);
  });
});

// ----------------------------------------------------------------------

describe('requestLiveAccess', () => {
  it('sends POST to /live/access', async () => {
    const response = { granted: true, expiresAt: '2025-01-01T00:00:00Z' };
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce(response);

    const result = await requestLiveAccess();

    expect(client.apiFetch).toHaveBeenCalledWith(
      '/live/access',
      expect.objectContaining({ method: 'POST' })
    );
    expect(result!.granted).toBe(true);
  });

  it('handles denied access response', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({
      granted: false,
      message: 'Not authorized',
    });

    const result = await requestLiveAccess();
    expect(result!.granted).toBe(false);
    expect(result!.message).toBe('Not authorized');
  });
});
