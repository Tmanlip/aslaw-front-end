import axios from "axios";
import AuthMemory from "../data/authMemory"; // wherever you store token

const inFlightGetRequests = new Map<string, Promise<any>>();

const axiosUser = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
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

// 🔥 Attach Bearer token automatically
axiosUser.interceptors.request.use((config) => {
  const token = resolveToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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