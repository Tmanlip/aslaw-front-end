import axiosUser from "../api/axiosUser";
import { LawyerFullData } from "../data/userInfo";
const CACHE_TTL_MS = 5000;

const lawyerCache = new Map<string, { data: LawyerFullData; timestamp: number }>();
const inFlightRequests = new Map<string, Promise<LawyerFullData>>();

export const fetchLawyerFullData = async (firmID: string): Promise<LawyerFullData> => {
  const now = Date.now();
  const cached = lawyerCache.get(firmID);

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const existingRequest = inFlightRequests.get(firmID);
  if (existingRequest) {
    return existingRequest;
  }

  const request = axiosUser
    .get<LawyerFullData>(`/lawyers/${firmID}`)
    .then((response) => {
      lawyerCache.set(firmID, { data: response.data, timestamp: Date.now() });
      return response.data;
    })
    .finally(() => {
      inFlightRequests.delete(firmID);
    });

  inFlightRequests.set(firmID, request);

  return request;
};

// Clear cache and refetch data to reflect recent changes (e.g., after file upload)
export const invalidateLawyerCache = (firmID: string) => {
  lawyerCache.delete(firmID);
};