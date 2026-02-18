import axios from "axios";
import AuthMemory from "../data/authMemory";
import { LawyerFullData } from "../data/userInfo";

export const fetchLawyerFullData = async (firmID: string): Promise<LawyerFullData> => {
  const token = AuthMemory.getToken();
  const response = await axios.get<LawyerFullData>(`http://localhost:8000/api/lawyers/${firmID}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Optional: store in AuthMemory if you want
  // AuthMemory.setLawyerFullData(response.data);

  return response.data;
};