import axios from "axios";
import AuthMemory from "../data/authMemory"; // wherever you store token

const axiosUser = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
  withCredentials: true, // ✅ important
});

// 🔥 Attach Bearer token automatically
axiosUser.interceptors.request.use((config) => {
  const token = AuthMemory.getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default axiosUser;