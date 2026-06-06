import axiosUser from "../api/axiosUser";
import AuthMemory from "../data/authMemory";
import { ClientFullData } from "../data/userInfo";

export const fetchClientFullData = async (firmID: string) => {
  const response = await axiosUser.get<ClientFullData>(`/clients/${firmID}`);

  AuthMemory.setClientFullData(response.data);
  return response.data;
};
