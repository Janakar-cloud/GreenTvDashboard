import { apiFetch } from './client';

export type LiveConfig = {
  streamUrl?: string;
  title?: string;
  description?: string;
  updatedBy?: string;
  updatedAt?: string;
  _id?: string;
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
