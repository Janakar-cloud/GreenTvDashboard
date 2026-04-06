import { apiFetch } from "./client";

export type TagItem = {
  id: string;
  label: string;
  type?: string;
};

const DEFAULT_MEDIA_MENUS = ["LiveTv", "Podcast"];

export async function getCategories(type?: "media" | "article" | "post"): Promise<string[]> {
  const query = type ? `?type=${type}` : "";
  const response = await apiFetch<{ data?: unknown[] } | unknown[]>(`/api/categories${query}`, { auth: false });
  const raw = Array.isArray(response) ? response : (response as { data?: unknown[] })?.data || [];
  return raw.map((item) =>
    typeof item === 'string' ? item : (item as { name?: string }).name ?? String(item)
  );
}

export async function getMenus() {
  const result = await apiFetch<{ data?: string[] }>(`/api/menus`, { auth: false }).catch(
    () => null
  );

  if (result && typeof result === "object" && "data" in result && Array.isArray(result.data)) {
    return result.data;
  }

  return DEFAULT_MEDIA_MENUS;
}

export async function getTags(type?: "article" | "media") {
  const query = type ? `?type=${type}` : "";
  return apiFetch<TagItem[] | { data?: TagItem[] }>(`/api/tags${query}`, { auth: false });
}

export async function createTag(label: string, type?: string) {
  return apiFetch<TagItem>('/tags', {
    method: 'POST',
    body: JSON.stringify({ label, type }),
  });
}

export async function deleteTag(id: string) {
  await apiFetch<void>(`/tags/${id}`, { method: 'DELETE' });
}
