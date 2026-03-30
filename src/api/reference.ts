import { apiFetch } from "./client";

export async function getCategories(type?: "media" | "article" | "post") {
  const query = type ? `?type=${type}` : "";
  return apiFetch<{ data?: string[] } | string[]>(`/categories${query}`, { auth: false });
}

export async function getMenus() {
  return apiFetch<{ data?: string[] } | string[]>("/menus", { auth: false });
}

export async function getTags(type?: "article" | "media") {
  const query = type ? `?type=${type}` : "";
  return apiFetch<{ data?: string[] } | string[]>(`/tags${query}`, { auth: false });
}
