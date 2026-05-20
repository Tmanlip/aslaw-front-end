const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

const isLocalHost = (value: string): boolean =>
  /^localhost(?::\d+)?$/i.test(value) || /^127\.0\.0\.1(?::\d+)?$/i.test(value);

const normalizeEnvUrl = (value?: string): string => {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";

  const normalized = trimTrailingSlash(trimmed);
  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  if (normalized.startsWith("/")) {
    return normalized;
  }

  if (isLocalHost(normalized)) {
    return `http://${normalized}`;
  }

  return `https://${normalized}`;
};

const isAzureStaticWebAppHost = (hostname: string): boolean =>
  hostname.toLowerCase().endsWith(".azurestaticapps.net");

const isAzureWebAppHost = (hostname: string): boolean =>
  hostname.toLowerCase().endsWith(".azurewebsites.net");

const shouldUseSwaProxy = (candidateApiUrl: string): boolean => {
  if (typeof window === "undefined") return false;
  if (!isAzureStaticWebAppHost(window.location.hostname)) return false;

  try {
    const parsed = new URL(candidateApiUrl, window.location.origin);
    return isAzureWebAppHost(parsed.hostname);
  } catch {
    return false;
  }
};

export const resolveApiBaseUrl = (): string => {
  const apiUrlFromEnv = normalizeEnvUrl(process.env.REACT_APP_API_URL);
  const baseUrlFromEnv = normalizeEnvUrl(process.env.REACT_APP_BASE_URL);

  const localFallback =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
      ? "http://localhost:8000/api"
      : "/api";

  const envResolved =
    apiUrlFromEnv || (baseUrlFromEnv ? `${trimTrailingSlash(baseUrlFromEnv)}/api` : "") || localFallback;

  if (typeof window === "undefined") {
    return trimTrailingSlash(envResolved);
  }

  if (shouldUseSwaProxy(envResolved)) {
    return `${window.location.origin}/api`;
  }

  if (envResolved.startsWith("/")) {
    return `${window.location.origin}${envResolved}`;
  }

  return trimTrailingSlash(envResolved);
};

export const rewriteApiUrlForSwa = (targetUrl: string): string => {
  if (typeof window === "undefined") return targetUrl;

  if (!isAzureStaticWebAppHost(window.location.hostname)) {
    return targetUrl;
  }

  try {
    const parsed = new URL(targetUrl, window.location.origin);
    if (!isAzureWebAppHost(parsed.hostname)) {
      return targetUrl;
    }

    const path = parsed.pathname.startsWith("/api")
      ? parsed.pathname
      : `/api${parsed.pathname.startsWith("/") ? parsed.pathname : `/${parsed.pathname}`}`;

    return `${window.location.origin}${path}${parsed.search}${parsed.hash}`;
  } catch {
    return targetUrl;
  }
};
