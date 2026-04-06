import { apiFetch } from './client';

export type SearchResultItem = {
  id: string;
  type: string;
  menu?: string;
  title: string;
  description?: string;
  subtitle?: string;
  thumbnailUrl?: string;
  coverImage?: string;
  url?: string;
  duration?: string;
  publishDate?: string;
  readTime?: string;
  tags?: string[];
  featured?: boolean;
  status?: string;
};

export type GlobalSearchResponse = {
  query: string;
  results: {
    media: SearchResultItem[];
    articles: SearchResultItem[];
  };
  totalResults: number;
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
