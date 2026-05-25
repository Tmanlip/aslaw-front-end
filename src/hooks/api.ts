import AuthMemory from "../data/authMemory";
import { resolveApiBaseUrl } from "../api/resolveApiBaseUrl";

const API_URL = resolveApiBaseUrl().replace(/\/+$/, "");

const tryParseJson = (text: string): unknown => {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const token = AuthMemory.getToken();
  const isFormDataBody = typeof FormData !== "undefined" && options.body instanceof FormData;

  // Add Authorization header if logged in
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (!isFormDataBody && !("Content-Type" in headers)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const safeEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const res = await fetch(`${API_URL}${safeEndpoint}`, {
    ...options,
    headers,
  });

  const responseText = await res.text();
  const parsed = tryParseJson(responseText);
  const data = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;

  if (!res.ok) {
    const error = new Error(
      typeof data?.message === "string" && data.message
        ? data.message
        : responseText || `API request failed with status ${res.status}`
    ) as Error & { status?: number; payload?: unknown };
    error.status = res.status;
    error.payload = parsed;
    throw error;
  }

  if (parsed !== null) {
    return parsed;
  }

  return {};
};
