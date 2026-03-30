import { apiFetch } from './client';

export type ArticleItem = {
  id: string;
  title: string;
  subtitle?: string;
  bodyMd?: string;
  readTime?: string;
  coverImage?: string;
  publishDate?: string;
  status?: 'published' | 'draft';
  featured?: boolean;
  tags?: string[];
};

export type ArticlePayload = Omit<ArticleItem, 'id'>;

export type ArticleListResponse = {
  items: ArticleItem[];
  total?: number;
  page?: number;
  pageSize?: number;
};

type ArticleQuery = {
  tag?: string;
  featured?: boolean | string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export async function getArticles(params: ArticleQuery = {}) {
  const query = new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== '')
      .map(([key, value]) => [key, String(value)])
  );
  const qs = query.toString();
  return apiFetch<ArticleListResponse>(qs ? `/articles?${qs}` : '/articles');
}

export async function getArticle(id: string) {
  return apiFetch<ArticleItem>(`/articles/${id}`);
}

export async function createArticle(payload: ArticlePayload) {
  return apiFetch<ArticleItem>('/articles', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateArticle(id: string, payload: Partial<ArticlePayload>) {
  return apiFetch<ArticleItem>(`/articles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteArticle(id: string) {
  await apiFetch<void>(`/articles/${id}`, {
    method: 'DELETE',
  });
}

export async function patchArticleStatus(id: string, status: 'published' | 'draft') {
  return apiFetch<ArticleItem>(`/articles/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
