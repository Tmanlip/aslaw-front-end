import axiosUser from "../api/axiosUser";
import AuthMemory from "../data/authMemory";
import { ClientFullData } from "../data/userInfo";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

export const fetchClientFullData = async (firmID: string) => {
  const response = await axiosUser.get<ClientFullData>(`${API_URL}/clients/${firmID}`);

  AuthMemory.setClientFullData(response.data);
  return response.data;
};
