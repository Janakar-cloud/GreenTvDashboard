import { apiFetch } from './client';

export type AboutBlock = {
  id: string;
  kind: 'theme' | 'timeline' | 'gallery' | 'cta' | string;
  title: string;
  body?: string;
  mediaUrl?: string;
  order?: number;
};

export type AboutBlockPayload = Omit<AboutBlock, 'id'>;

export async function getAboutBlocks(search?: string) {
  const qs = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiFetch<AboutBlock[]>(`/about${qs}`);
}

export async function getAboutBlock(id: string) {
  return apiFetch<AboutBlock>(`/about/${id}`);
}

export async function createAboutBlock(payload: AboutBlockPayload) {
  return apiFetch<AboutBlock>('/about', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAboutBlock(id: string, payload: Partial<AboutBlockPayload>) {
  return apiFetch<AboutBlock>(`/about/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteAboutBlock(id: string) {
  await apiFetch<void>(`/about/${id}`, {
    method: 'DELETE',
  });
}
