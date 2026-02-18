import axios from "axios";
import AuthMemory from "../data/authMemory";
import { ClientFullData } from "../data/userInfo";

export const fetchClientFullData = async (firmID: string) => {
  const token = AuthMemory.getToken();
  const response = await axios.get<ClientFullData>(`http://localhost:8000/api/clients/${firmID}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  AuthMemory.setClientFullData(response.data);
  return response.data;
};
