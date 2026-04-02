import { apiFetch } from './client';

export type LiveConfig = {
  streamUrl?: string;
  title?: string;
  description?: string;
  updatedBy?: string;
  updatedAt?: string;
  _id?: string;
};

export type LivePlaylist = {
  playlistUrl?: string;
  expiresAt?: string;
  status?: string;
};

export type LiveAccessResponse = {
  granted: boolean;
  expiresAt?: string;
  message?: string;
};

export async function getLiveConfig() {
  return apiFetch<LiveConfig>('/live/config', { auth: false });
}

export async function updateLiveConfig(payload: LiveConfig) {
  return apiFetch<LiveConfig>('/live/config', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function getLivePlaylist() {
  return apiFetch<LivePlaylist>('/live/playlist');
}

export async function requestLiveAccess() {
  return apiFetch<LiveAccessResponse>('/live/access', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
