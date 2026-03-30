import { apiFetch } from './client';

export type GlobalSearchResponse = {
  media?: unknown[];
  articles?: unknown[];
  posts?: unknown[];
  caseStories?: unknown[];
};

type SearchParams = {
  q: string;
  type?: 'all' | 'media' | 'articles' | 'posts' | 'caseStories';
  limit?: number;
};

export async function globalSearch(params: SearchParams) {
  const query = new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== '')
      .map(([key, value]) => [key, String(value)])
  );
  const qs = query.toString();
  return apiFetch<GlobalSearchResponse>(`/search?${qs}`);
}
