import axiosUser from "../api/axiosUser";
import { User } from "../context/ClientDataContext";

export const updateUser = async (
  firmID: string,
  payload: Partial<User>
) => {
  const response = await axiosUser.put(
    `/users/${firmID}`,
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
    `/users/${firmID}`,
    { reset_password: true },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};
