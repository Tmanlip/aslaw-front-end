// src/data/UserData.ts
import profilePic from "../assets/pics/Passport pic.png"; // ✅ centralize photo here

export interface User {
  name: string;
  firstname: string;
  lastname: string;
  age: number;
  email: string;
  username: string;
  photo: string; // ✅ add photo field
  progress: number
  role: "admin" | "lawyer" | "client";
}

export const userData: User = {
  role: "admin",
  name: "John Doe",
  firstname: "John",
  lastname: "Doe",
  age: 25,
  email: "john.doe@example.com",
  username: "johndoe",
  photo: profilePic, // ✅ photo included
  progress: 60
};