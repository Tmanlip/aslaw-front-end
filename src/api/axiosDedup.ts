import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

const GET_CACHE_TTL_MS = 2000;

type CacheEntry = {
  expiresAt: number;
  response: AxiosResponse;
};

const inFlightGetRequests = new Map<string, Promise<AxiosResponse>>();
const getResponseCache = new Map<string, CacheEntry>();

const originalAxiosGet = axios.get.bind(axios);

const buildRequestKey = (url: string, config?: AxiosRequestConfig): string => {
  const baseURL = config?.baseURL || "";
  const params = config?.params ? JSON.stringify(config.params) : "";
  const authHeader =
    (config?.headers as Record<string, string> | undefined)?.Authorization || "";
  return `${baseURL}|${url}|${params}|${authHeader}`;
};

axios.get = function getWithDedup<T = any, R = AxiosResponse<T>, D = any>(
  url: string,
  config?: AxiosRequestConfig<D>
): Promise<R> {
  const requestKey = buildRequestKey(url, config);
  const now = Date.now();

  const cached = getResponseCache.get(requestKey);
  if (cached && cached.expiresAt > now) {
    return Promise.resolve(cached.response as R);
  }

  const inFlight = inFlightGetRequests.get(requestKey);
  if (inFlight) {
    return inFlight as Promise<R>;
  }

  const requestPromise = originalAxiosGet<T, R, D>(url, config)
    .then((response) => {
      getResponseCache.set(requestKey, {
        expiresAt: Date.now() + GET_CACHE_TTL_MS,
        response: response as AxiosResponse,
      });
      return response;
    })
    .finally(() => {
      inFlightGetRequests.delete(requestKey);
    });

  inFlightGetRequests.set(requestKey, requestPromise as Promise<AxiosResponse>);
  return requestPromise;
};

export {};