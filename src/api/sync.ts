import { apiFetch } from './client';

export type S3SyncResult = {
  durationMs: number;
  videos: { added: number; updated: number };
  podcasts: { added: number; updated: number };
  articles?: { added: number; updated: number };
  removed: { videos: number; podcasts: number };
};

export type SyncDiagnosis = {
  s3: { videos: number; podcasts: number; articles?: number };
  db: { videos: number; podcasts: number; articles?: number };
  diff: { videosOnlyInS3: string[]; podcastsOnlyInS3: string[]; videosOnlyInDb: string[]; podcastsOnlyInDb: string[] };
};

/** Trigger a manual S3 → DB sync (admin/superadmin only) */
export async function triggerS3Sync(): Promise<S3SyncResult> {
  return apiFetch<S3SyncResult>('/sync/s3', { method: 'POST' });
}

/** Get diagnosis of S3 vs DB drift (admin/superadmin only) */
export async function getSyncDiagnosis(): Promise<SyncDiagnosis> {
  return apiFetch<SyncDiagnosis>('/sync/diagnose');
}
