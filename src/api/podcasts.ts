import { apiFetch } from './client';

export type PodcastComment = {
  id: string;   // normalised from _id
  _id?: string; // raw from backend
  podcastId: string;
  author: string;
  message: string;
  status?: 'visible' | 'hidden';
  createdAt?: string;
};

type PublicCommentsResponse = {
  commentsEnabled: boolean;
  comments: (Omit<PodcastComment, 'id'> & { _id: string })[];
};

function normaliseComment(c: Omit<PodcastComment, 'id'> & { _id: string }): PodcastComment {
  return { ...c, id: c._id };
}

export async function getPodcastComments(id: string, includeHidden = false) {
  if (includeHidden) {
    // /comments/all returns a plain array (admin route)
    const data = await apiFetch<(Omit<PodcastComment, 'id'> & { _id: string })[]>(`/podcasts/${id}/comments/all`, { auth: true });
    return (data ?? []).map(normaliseComment);
  }
  // /comments returns { commentsEnabled, comments[] }
  const data = await apiFetch<PublicCommentsResponse>(`/podcasts/${id}/comments`);
  return (data?.comments ?? []).map(normaliseComment);
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
