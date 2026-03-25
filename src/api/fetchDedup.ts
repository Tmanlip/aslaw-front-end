const GET_CACHE_TTL_MS = 2000;

type FetchCacheEntry = {
  expiresAt: number;
  response: Response;
};

const originalFetch = window.fetch.bind(window);
const inFlightGetRequests = new Map<string, Promise<Response>>();
const getResponseCache = new Map<string, FetchCacheEntry>();

const getHeaderValue = (headers: HeadersInit | undefined, headerName: string): string => {
  if (!headers) return "";

  if (headers instanceof Headers) {
    return headers.get(headerName) || "";
  }

  if (Array.isArray(headers)) {
    const entry = headers.find(([key]) => key.toLowerCase() === headerName.toLowerCase());
    return entry?.[1] || "";
  }

  const recordHeaders = headers as Record<string, string>;
  const matchedKey = Object.keys(recordHeaders).find(
    (key) => key.toLowerCase() === headerName.toLowerCase()
  );
  return matchedKey ? recordHeaders[matchedKey] : "";
};

const buildRequestKey = (input: RequestInfo | URL, init?: RequestInit): string => {
  const method = (init?.method || "GET").toUpperCase();
  const initAuth = getHeaderValue(init?.headers, "Authorization");
  const initRole = getHeaderValue(init?.headers, "X-User-Role");
  const initFirmId = getHeaderValue(init?.headers, "X-User-FirmID");

  if (typeof input === "string") {
    return `${method}|${input}|${initAuth}|${initRole}|${initFirmId}`;
  }

  if (input instanceof URL) {
    return `${method}|${input.toString()}|${initAuth}|${initRole}|${initFirmId}`;
  }

  const requestAuth = input.headers.get("Authorization") || "";
  const requestRole = input.headers.get("X-User-Role") || "";
  const requestFirmId = input.headers.get("X-User-FirmID") || "";

  return `${method}|${input.url}|${initAuth || requestAuth}|${initRole || requestRole}|${
    initFirmId || requestFirmId
  }`;
};

window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const method = (init?.method || "GET").toUpperCase();

  if (method !== "GET") {
    return originalFetch(input, init);
  }

  const requestKey = buildRequestKey(input, init);
  const now = Date.now();

  const cached = getResponseCache.get(requestKey);
  if (cached && cached.expiresAt > now) {
    return Promise.resolve(cached.response.clone());
  }

  const inFlight = inFlightGetRequests.get(requestKey);
  if (inFlight) {
    return inFlight.then((response) => response.clone());
  }

  const requestPromise = originalFetch(input, init)
    .then((response) => {
      const baseResponse = response.clone();

      if (response.ok) {
        getResponseCache.set(requestKey, {
          expiresAt: Date.now() + GET_CACHE_TTL_MS,
          response: baseResponse.clone(),
        });
      }

      return baseResponse;
    })
    .finally(() => {
      inFlightGetRequests.delete(requestKey);
    });

  inFlightGetRequests.set(requestKey, requestPromise);
  return requestPromise.then((response) => response.clone());
};

export {};