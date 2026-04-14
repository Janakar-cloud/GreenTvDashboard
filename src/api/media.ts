import { apiFetch, uploadToSignedUrlWithProgress, uploadPartWithProgress } from "./client";

export type CategoryOption = {
  id: string;
  name: string;
};

export type MediaItem = {
  id: string;
  title: string;
  description?: string;
  mediaType: "video" | "audio";
  menu: "LiveTv" | "Podcast";
  category?: string;
  categories?: string[];
  tags?: string[];
  duration?: number;
  fileUrl: string;
  thumbnailUrl?: string;
  status: "processing" | "ready" | "failed" | "published";
  views?: number;
  likes?: number;
  commentsCount?: number;
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
  status?: "processing" | "ready" | "failed" | "published";
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
  categories: string[];  // min 2 Category ObjectId strings
  duration?: number;
  fileUrl: string;
  thumbnailUrl?: string;
  status?: "processing" | "ready" | "failed" | "published";
}) {
  return apiFetch<MediaItem>("/media", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMediaById(id: string) {
  return apiFetch<MediaItem>(`/media/${id}`);
}

export async function updateMedia(id: string, payload: Partial<Omit<MediaItem, "id" | "createdAt" | "updatedAt">> & { categories?: string[] }) {
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

export async function getMediaCategories(): Promise<CategoryOption[]> {
  const response = await apiFetch<{ data?: unknown[] } | unknown[]>('/media/categories', { auth: false });
  const raw = Array.isArray(response) ? response : (response as { data?: unknown[] })?.data || [];
  return raw
    .filter((item): item is { id: string; name: string } =>
      typeof item === 'object' && item !== null && 'id' in item && 'name' in item
    )
    .map((item) => ({ id: item.id, name: item.name }));
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

// ─── Multipart upload (for files > MULTIPART_THRESHOLD) ──────────────────────

const MULTIPART_THRESHOLD = 300 * 1024 * 1024; // 300 MiB — use single PUT below this
const PART_SIZE = 300 * 1024 * 1024;            // 300 MiB per part

async function startMultipartUpload(prefix: string) {
  return apiFetch<{ uploadId: string; key: string; fileUrl: string }>(
    "/uploads/presign/multipart/start",
    { method: "POST", body: JSON.stringify({ prefix }) }
  );
}

async function getPartUploadUrl(key: string, uploadId: string, partNumber: number) {
  return apiFetch<{ url: string }>(
    "/uploads/presign/multipart/part",
    { method: "POST", body: JSON.stringify({ key, uploadId, partNumber }) }
  );
}

async function finishMultipartUpload(
  key: string,
  uploadId: string,
  parts: { PartNumber: number; ETag: string }[]
) {
  return apiFetch<{ ok: boolean }>(
    "/uploads/presign/multipart/complete",
    { method: "POST", body: JSON.stringify({ key, uploadId, parts }) }
  );
}

async function cancelMultipartUpload(key: string, uploadId: string) {
  return apiFetch<{ ok: boolean }>(
    "/uploads/presign/multipart/abort",
    { method: "POST", body: JSON.stringify({ key, uploadId }) }
  );
}

/**
 * Upload a file to S3, automatically switching to multipart for files > 100 MiB.
 * Parts are 50 MiB each; overall progress (0–100) is reported via onProgress.
 * Returns the permanent public fileUrl to store in the database.
 */
export async function uploadMediaFile(
  prefix: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  if (file.size <= MULTIPART_THRESHOLD) {
    // Small file — use a single presigned PUT
    const { url, fileUrl } = await requestUploadUrl(prefix, file.type);
    await uploadFileWithProgress(url, file, onProgress);
    return fileUrl;
  }

  // Large file — S3 multipart upload (parallel, 2 parts at a time)
  const PARALLEL = 2;
  const { uploadId, key, fileUrl } = await startMultipartUpload(prefix);
  const totalParts = Math.ceil(file.size / PART_SIZE);
  const parts: { PartNumber: number; ETag: string }[] = new Array(totalParts);
  const uploadedPerPart = new Array(totalParts).fill(0);

  const uploadPart = async (i: number) => {
    const start = i * PART_SIZE;
    const end = Math.min(start + PART_SIZE, file.size);
    const chunk = file.slice(start, end);
    const chunkSize = end - start;
    const partNumber = i + 1;

    const { url } = await getPartUploadUrl(key, uploadId, partNumber);
    const etag = await uploadPartWithProgress(url, chunk, (partPercent) => {
      uploadedPerPart[i] = (partPercent / 100) * chunkSize;
      if (onProgress) {
        const totalUploaded = uploadedPerPart.reduce((a, b) => a + b, 0);
        const overall = Math.round((totalUploaded / file.size) * 100);
        onProgress(Math.min(overall, 99));
      }
    });

    parts[i] = { PartNumber: partNumber, ETag: etag };
  };

  try {
    // Process all parts in batches of PARALLEL
    for (let i = 0; i < totalParts; i += PARALLEL) {
      const batch = Array.from(
        { length: Math.min(PARALLEL, totalParts - i) },
        (_, j) => uploadPart(i + j)
      );
      await Promise.all(batch);
    }

    await finishMultipartUpload(key, uploadId, parts);
    onProgress?.(100);
    return fileUrl;
  } catch (err) {
    // Best-effort abort to avoid S3 partial-upload storage charges
    cancelMultipartUpload(key, uploadId).catch(() => {});
    throw err;
  }
}
