import { apiFetch, setTokens, clearTokens } from "./client";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role?: string;
  status?: string;
  isVerified?: boolean;
  emailVerified?: boolean;
  avatarUrl?: string | null;
};

export type AppConfig = {
  publicUrl?: string;
  dashboardUrl?: string;
  preferredUrl?: string;
  shouldUseDashboard?: boolean;
  dashboardLoginUrl?: string;
  publicLoginUrl?: string;
};

export type MeResponse = {
  user: UserProfile;
  app: AppConfig;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type LoginResponse = AuthTokens & {
  user?: UserProfile;
};

type MaybeWrapped<T> = T | { data?: T };

type TokenCarrier = {
  accessToken?: string;
  refreshToken?: string;
  token?: string;
  access_token?: string;
  refresh_token?: string;
};

function unwrapData<T>(value: MaybeWrapped<T> | null | undefined): T | undefined {
  if (!value || typeof value !== "object") {
    return value as T | undefined;
  }

  if ("data" in value) {
    const nested = (value as { data?: T }).data;
    if (nested !== undefined) return nested;
  }

  return value as T;
}

function extractTokens(payload: unknown): { accessToken?: string; refreshToken?: string } {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  const source = payload as TokenCarrier;
  return {
    accessToken: source.accessToken || source.access_token || source.token,
    refreshToken: source.refreshToken || source.refresh_token,
  };
}

const USER_STORAGE_KEY = "currentUser";

export function getStoredUser(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(USER_STORAGE_KEY);
    return value ? (JSON.parse(value) as UserProfile) : null;
  } catch (error) {
    return null;
  }
}

export async function login(email: string, password: string) {
  const response = await apiFetch<MaybeWrapped<LoginResponse>>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    auth: false,
  });
  const data = unwrapData<LoginResponse>(response);
  const tokens = extractTokens(data);

  if (tokens.accessToken) {
    setTokens(tokens.accessToken, tokens.refreshToken);
  }

  if (data?.user && typeof window !== "undefined") {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
  }

  return data;
}

export async function register(email: string, password: string, name?: string) {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
    auth: false,
  });
}

export async function verifyEmail(email: string, code: string) {
  const response = await apiFetch<MaybeWrapped<AuthTokens>>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ email, code }),
    auth: false,
  });
  const data = unwrapData<AuthTokens>(response);
  const tokens = extractTokens(data);

  if (tokens.accessToken) {
    setTokens(tokens.accessToken, tokens.refreshToken);
  }

  return data;
}

export async function resendVerification(email: string) {
  return apiFetch("/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
    auth: false,
  });
}

export async function requestPasswordReset(email: string) {
  return apiFetch("/auth/request-reset", {
    method: "POST",
    body: JSON.stringify({ email }),
    auth: false,
  });
}

export async function resetPassword(token: string, password: string) {
  return apiFetch("/auth/reset", {
    method: "POST",
    body: JSON.stringify({ token, password }),
    auth: false,
  });
}

export async function logoutApi(refreshToken: string) {
  return apiFetch("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export async function getMe() {
  const response = await apiFetch<MaybeWrapped<MeResponse>>("/auth/me");
  const data = unwrapData<MeResponse>(response);
  if (data?.user && typeof window !== "undefined") {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
  }
  return data as MeResponse;
}

export function logout() {
  clearTokens();
  if (typeof window !== "undefined") {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}
