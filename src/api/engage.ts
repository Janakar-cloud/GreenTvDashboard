import { apiFetch } from './client';

export type ContentType = 'video' | 'podcast' | 'article';

export interface EngageStats {
  views: number;
  likes: number;
  commentsCount: number;
}

export interface TrendingItem {
  _id: string;
  title: string;
  views: number;
  likes: number;
  commentsCount: number;
  thumbnailUrl?: string;
  imageUrl?: string;
  coverImage?: string;
  publishDate?: string;
  createdAt?: string;
  _type: ContentType;
}

export interface TrendingResponse {
  items: TrendingItem[];
  total: number;
}

/** Get views, likes, commentsCount for a single item */
export async function getEngageStats(type: ContentType, id: string): Promise<EngageStats> {
  return apiFetch<EngageStats>(`/engage/stats/${type}/${id}`);
}

/** Trending content sorted by views */
export async function getTrending(opts: {
  type?: 'video' | 'podcast' | 'article' | 'all';
  limit?: number;
  days?: number;
} = {}): Promise<TrendingResponse> {
  const params = new URLSearchParams();
  if (opts.type) params.set('type', opts.type);
  if (opts.limit) params.set('limit', String(opts.limit));
  if (opts.days) params.set('days', String(opts.days));
  const qs = params.toString();
  return apiFetch<TrendingResponse>(qs ? `/engage/trending?${qs}` : '/engage/trending');
}

/** Latest published content sorted by date */
export async function getLatest(opts: {
  type?: 'video' | 'podcast' | 'article' | 'all';
  limit?: number;
} = {}): Promise<TrendingResponse> {
  const params = new URLSearchParams();
  if (opts.type) params.set('type', opts.type);
  if (opts.limit) params.set('limit', String(opts.limit));
  const qs = params.toString();
  return apiFetch<TrendingResponse>(qs ? `/engage/latest?${qs}` : '/engage/latest');
}

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface AppLogItem {
  _id: string;
  level: LogLevel;
  message: string;
  source?: string;
  meta?: Record<string, unknown>;
  userId?: string;
  ip?: string;
  createdAt: string;
}

export interface LogsResponse {
  data: AppLogItem[];
  meta: { page: number; limit: number; total: number };
}

export type LogsQuery = {
  page?: number;
  limit?: number;
  level?: LogLevel;
  source?: string;
  search?: string;
  from?: string;
  to?: string;
};

/** Fetch DB logs (admin/superadmin only) */
export async function getLogs(params: LogsQuery = {}): Promise<LogsResponse> {
  const query = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => [k, String(v)])
  );
  const qs = query.toString();
  return apiFetch<LogsResponse>(qs ? `/logs?${qs}` : '/logs');
}

/** Delete logs by filter (superadmin only) */
export async function deleteLogs(opts: { olderThanDays?: number; level?: LogLevel }) {
  const params = new URLSearchParams();
  if (opts.olderThanDays) params.set('olderThanDays', String(opts.olderThanDays));
  if (opts.level) params.set('level', opts.level);
  return apiFetch<{ deleted: number }>(`/logs?${params.toString()}`, { method: 'DELETE' });
}
