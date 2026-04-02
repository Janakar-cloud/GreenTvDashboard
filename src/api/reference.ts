import { apiFetch } from "./client";

export type TagItem = {
  id: string;
  label: string;
  type?: string;
};

export async function getCategories(type?: "media" | "article" | "post") {
  const query = type ? `?type=${type}` : "";
  return apiFetch<{ data?: string[] } | string[]>(`/categories${query}`, { auth: false });
}

export async function getMenus() {
  return apiFetch<{ data?: string[] } | string[]>("/menus", { auth: false });
}

export async function getTags(type?: "article" | "media") {
  const query = type ? `?type=${type}` : "";
  return apiFetch<TagItem[] | { data?: TagItem[] }>(`/tags${query}`, { auth: false });
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
