import axios from "axios";
import AuthMemory from "../data/authMemory"; // wherever you store token

const axiosUser = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
  withCredentials: true, // ✅ important
});

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

export default axiosUser;