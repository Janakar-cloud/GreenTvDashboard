import { apiFetch, uploadToSignedUrlWithProgress } from "./client";

export type MediaItem = {
  id: string;
  title: string;
  description?: string;
  mediaType: "video" | "audio";
  menu: "LiveTv" | "Podcast";
  category?: string;
  tags?: string[];
  duration?: number;
  fileUrl: string;
  thumbnailUrl?: string;
  status: "processing" | "ready" | "failed";
  createdAt?: string;
  updatedAt?: string;
};

export type MediaListResponse = {
  data: MediaItem[];
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
};

type MediaFilters = {
  page?: number;
  limit?: number;
  search?: string;
  menu?: "LiveTv" | "Podcast";
  mediaType?: "video" | "audio";
  category?: string;
  status?: "processing" | "ready" | "failed";
};

export async function getMedia(filters: MediaFilters = {}) {
  const query = new URLSearchParams(
    Object.entries(filters)
      .filter(([, value]) => value !== undefined && value !== "")
      .map(([key, value]) => [key, String(value)])
  );

  const qs = query.toString();
  return apiFetch<MediaListResponse | MediaItem[]>(qs ? `/media?${qs}` : "/media");
}

export async function createMedia(payload: {
  title: string;
  description?: string;
  mediaType: "video" | "audio";
  menu: "LiveTv" | "Podcast";
  category?: string;
  tags?: string[];
  duration?: number;
  fileUrl: string;
  thumbnailUrl?: string;
  status?: "processing" | "ready" | "failed";
}) {
  return apiFetch<MediaItem>("/media", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMediaById(id: string) {
  return apiFetch<MediaItem>(`/media/${id}`);
}

export async function updateMedia(id: string, payload: Partial<Omit<MediaItem, "id" | "createdAt" | "updatedAt">>) {
  return apiFetch<MediaItem>(`/media/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteMedia(id: string) {
  await apiFetch<void>(`/media/${id}`, {
    method: "DELETE",
  });
}

export async function updateMediaStatus(
  id: string,
  status: "processing" | "ready" | "failed",
  updates?: { fileUrl?: string; thumbnailUrl?: string; duration?: number }
) {
  return apiFetch<MediaItem>(`/media/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, ...updates }),
  });
}

export async function getMediaCategories(): Promise<string[]> {
  const response = await apiFetch<{ data?: unknown[] } | unknown[]>('/media/categories', { auth: false });
  const raw = Array.isArray(response) ? response : (response as { data?: unknown[] })?.data || [];
  return raw.map((item) =>
    typeof item === 'string' ? item : (item as { name?: string }).name ?? String(item)
  );
}

export async function requestUploadUrl(prefix: string, contentType: string) {
  return apiFetch<{ url: string; fileUrl: string }>("/uploads/presign", {
    method: "POST",
    body: JSON.stringify({ prefix, contentType }),
  });
}

export async function uploadFileWithProgress(
  signedUrl: string,
  file: File,
  onProgress?: (percent: number) => void
) {
  await uploadToSignedUrlWithProgress(signedUrl, file, onProgress);
}
