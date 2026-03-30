import { apiFetch } from './client';

export type CaseStory = {
  id: string;
  title: string;
  impact?: string;
  duration?: string;
  heroImage?: string;
  metrics?: { label: string; value: string }[];
  bodyMd?: string;
  tags?: string[];
};

export type CaseStoryPayload = Omit<CaseStory, 'id'>;

export type CaseStoryListResponse = {
  items: CaseStory[];
  total?: number;
  page?: number;
  pageSize?: number;
};

type CaseStoryQuery = {
  tag?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export async function getCaseStories(params: CaseStoryQuery = {}) {
  const query = new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== '')
      .map(([key, value]) => [key, String(value)])
  );
  const qs = query.toString();
  return apiFetch<CaseStoryListResponse>(qs ? `/case-stories?${qs}` : '/case-stories');
}

export async function getCaseStory(id: string) {
  return apiFetch<CaseStory>(`/case-stories/${id}`);
}

export async function createCaseStory(payload: CaseStoryPayload) {
  return apiFetch<CaseStory>('/case-stories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCaseStory(id: string, payload: Partial<CaseStoryPayload>) {
  return apiFetch<CaseStory>(`/case-stories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteCaseStory(id: string) {
  await apiFetch<void>(`/case-stories/${id}`, {
    method: 'DELETE',
  });
}
