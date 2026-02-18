import axios from "axios";
import { User } from "../context/ClientDataContext";

const API_BASE_URL = process.env.REACT_APP_API_URL;
// example: http://localhost:8000/api

export const updateUser = async (
  firmID: string,
  payload: Partial<User>
) => {
  const response = await axios.put(
    `${API_BASE_URL}/users/${firmID}`,
    payload,
    {
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${token}`, // if using auth
      },
    }
  );

  return response.data;
};
