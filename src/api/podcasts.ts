import { apiFetch } from './client';

export type PodcastComment = {
  id: string;
  podcastId: string;
  author: string;
  message: string;
  status?: 'visible' | 'hidden';
  createdAt?: string;
};

export async function getPodcastComments(id: string, includeHidden = false) {
  const path = includeHidden ? `/podcasts/${id}/comments/all` : `/podcasts/${id}/comments`;
  return apiFetch<PodcastComment[]>(path, { auth: !includeHidden });
}

export async function addPodcastComment(id: string, payload: { author: string; message: string; parentCommentId?: string }) {
  return apiFetch<PodcastComment>(`/podcasts/${id}/comments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function patchPodcastCommentStatus(podcastId: string, commentId: string, status: 'visible' | 'hidden') {
  return apiFetch<PodcastComment>(`/podcasts/${podcastId}/comments/${commentId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function deletePodcastComment(podcastId: string, commentId: string) {
  await apiFetch<void>(`/podcasts/${podcastId}/comments/${commentId}`, {
    method: 'DELETE',
  });
}
