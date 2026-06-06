import axios from "axios";
import AuthMemory from "../data/authMemory"; // wherever you store token
import { resolveApiBaseUrl, rewriteApiUrlForSwa } from "./resolveApiBaseUrl";

const inFlightGetRequests = new Map<string, Promise<any>>();

const axiosUser = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: true, // ✅ important
});

const buildRequestKey = (url: string, config?: any): string => {
  const params = config?.params ? JSON.stringify(config.params) : "";
  const authHeader =
    (config?.headers as Record<string, string> | undefined)?.Authorization || "";
  const roleHeader =
    (config?.headers as Record<string, string> | undefined)?.["X-User-Role"] || "";
  const firmHeader =
    (config?.headers as Record<string, string> | undefined)?.["X-User-FirmID"] || "";

  return `${url}|${params}|${authHeader}|${roleHeader}|${firmHeader}`;
};

const resolveToken = (): string | null => {
  const memoryToken = AuthMemory.getToken();
  if (memoryToken) {
    return memoryToken;
  }

  const localToken = localStorage.getItem("token");
  if (localToken) {
    return localToken;
  }

  const sessionToken = sessionStorage.getItem("token");
  return sessionToken || null;
};

const normalizeRequestUrl = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  // Handles templates like `${process.env.REACT_APP_API_URL}/users` when env var is unset.
  const withoutUndefinedPrefix = trimmed.replace(/^\/?undefined(?=\/|$)/i, "");
  if (withoutUndefinedPrefix !== trimmed) {
    return withoutUndefinedPrefix.startsWith("/")
      ? withoutUndefinedPrefix || "/"
      : `/${withoutUndefinedPrefix}`;
  }

  return trimmed;
};

const isLocalRuntimeHost = (hostname: string): boolean =>
  hostname === "localhost" || hostname === "127.0.0.1";

const rewriteLocalhostApiUrlForHostedRuntime = (url: string): string => {
  if (typeof window === "undefined") return url;

  const runtimeHost = window.location.hostname;
  if (isLocalRuntimeHost(runtimeHost)) {
    // Keep localhost URLs untouched while developing locally.
    return url;
  }

  try {
    const parsed = new URL(url, window.location.origin);
    if (!isLocalRuntimeHost(parsed.hostname)) {
      return url;
    }

    // Keep same-origin absolute URL to avoid axios baseURL prefixing `/api` twice.
    return `${window.location.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return url;
  }
};

// 🔥 Attach Bearer token automatically
axiosUser.interceptors.request.use((config) => {
  const token = resolveToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (typeof config.url === "string") {
    const normalizedUrl = normalizeRequestUrl(config.url);
    const runtimeSafeUrl = rewriteLocalhostApiUrlForHostedRuntime(normalizedUrl);
    config.url = rewriteApiUrlForSwa(runtimeSafeUrl);
  }

  return config;
});

const originalAxiosUserGet = axiosUser.get.bind(axiosUser);

axiosUser.get = function getWithDedup(url: string, config?: any): Promise<any> {
  const requestKey = buildRequestKey(url, config);

  const inFlight = inFlightGetRequests.get(requestKey);
  if (inFlight) {
    return inFlight;
  }

  const requestPromise = originalAxiosUserGet(url, config)
    .then((response) => response)
    .finally(() => {
      inFlightGetRequests.delete(requestKey);
    });

  inFlightGetRequests.set(requestKey, requestPromise);
  return requestPromise;
};

export default axiosUser;