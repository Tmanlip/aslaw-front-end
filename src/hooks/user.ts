import axiosUser from "../api/axiosUser";
import { User } from "../context/ClientDataContext";

const API_BASE_URL = process.env.REACT_APP_API_URL;
// example: http://localhost:8000/api

export const updateUser = async (
  firmID: string,
  payload: Partial<User>
) => {
  const response = await axiosUser.put(
    `${API_BASE_URL}/users/${firmID}`,
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

export const resetUserPasswordAuto = async (firmID: string) => {
  const response = await axiosUser.put(
    `${API_BASE_URL}/users/${firmID}`,
    { reset_password: true },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};
