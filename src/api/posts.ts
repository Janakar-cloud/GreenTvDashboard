import { apiFetch } from './client';

export type PostAuthor = {
  name: string;
  avatarUrl: string;
};

export type PostItem = {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  totalViews?: number;
  totalComments?: number;
  totalShares?: number;
  totalFavorites?: number;
  postedAt: string;
  author: PostAuthor;
};

export type PostListResponse = {
  data: PostItem[];
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
};

export type PostQuery = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  sort?: 'latest' | 'popular' | 'oldest';
};

export async function getPosts(params: PostQuery = {}) {
  const query = new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => [key, String(value)])
  );

  const qs = query.toString();
  return apiFetch<PostListResponse | PostItem[]>(qs ? `/posts?${qs}` : '/posts');
}

export async function getPost(id: string) {
  return apiFetch<PostItem>(`/posts/${id}`);
}

export async function createPost(payload: Omit<PostItem, 'id' | 'postedAt'> & { postedAt?: string }) {
  return apiFetch<PostItem>('/posts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updatePost(id: string, payload: Partial<PostItem>) {
  return apiFetch<PostItem>(`/posts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deletePost(id: string) {
  await apiFetch<void>(`/posts/${id}`, {
    method: 'DELETE',
  });
}
