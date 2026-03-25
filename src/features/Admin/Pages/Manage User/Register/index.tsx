// src/pages/HomePage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBarAdmin from "../../../../../shared/Navbar/NavBar Admin/new";
import Pagination from "react-bootstrap/Pagination";
import axiosUser from "../../../../../api/axiosUser";
import Page1Form from "./components/pageoneform";
import Page2Form from "./components/pagetwoform";
import RegisterCase from "./Register Case";
import { UserRole } from "../../../../../constant/user";
import PATH from "../../../../../constant/paths";
import "./registerUser.css";

type CreatedUser = {
  id: number;
  name: string;
  role: UserRole;
  firmID: string;
};

const RegisterUser: React.FC = () => {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [showRegisterCase, setShowRegisterCase] = useState(false);

  // Page 1 state
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | "">("");
  const [identification, setIdentification] = useState("");
  const [maritalStatus, setMaritalStatus] =
    useState<"Single" | "Married" | "Divorce" | "">("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");

  // Page 2 state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "lawyer" | "client" | "">("");
  const [picture, setPicture] = useState<File | null>(null);

  // Created user
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null);

  const validatePassportPicture = (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        resolve("Picture must be JPG or PNG format.");
        return;
      }

      const maxBytes = 2 * 1024 * 1024;
      if (file.size > maxBytes) {
        resolve("Picture must be 2MB or smaller.");
        return;
      }

      const imageUrl = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        const width = image.naturalWidth;
        const height = image.naturalHeight;
        URL.revokeObjectURL(imageUrl);

        if (width < 350 || height < 450) {
          resolve("Picture must be at least 350x450 pixels (passport size).");
          return;
        }

        const passportRatio = 35 / 45;
        const actualRatio = width / height;
        if (Math.abs(actualRatio - passportRatio) > 0.08) {
          resolve("Picture must follow passport ratio (35:45).");
          return;
        }

        resolve(null);
      };
      image.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        resolve("Unable to read selected picture.");
      };
      image.src = imageUrl;
    });
  };

  const handleSubmit = async () => {
    try {
      const ageNumber = parseInt(age, 10);
      if (isNaN(ageNumber)) {
        alert("Age must be a number");
        return;
      }

      if (!gender || !maritalStatus || !role) {
        alert("Please select all dropdowns correctly");
        return;
      }

      if (!picture) {
        alert("Please upload a passport-size picture.");
        return;
      }

      const pictureValidationError = await validatePassportPicture(picture);
      if (pictureValidationError) {
        alert(pictureValidationError);
        return;
      }

      const payload = new FormData();
      payload.append("name", fullName);
      payload.append("email", email);
      payload.append("username", username);
      payload.append("password", password);
      payload.append("role", role);
      payload.append("age", String(ageNumber));
      payload.append("ICNumber", identification);
      payload.append("phoneNumber", phoneNumber);
      payload.append("HomeAddress", address);
      payload.append("gender", gender);
      payload.append("maritalStatus", maritalStatus);
      payload.append("picture", picture);

      const response = await axiosUser.post(
        `${process.env.REACT_APP_API_URL}/registerusers`,
        payload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setCreatedUser({
        id: response.data.user.id,
        name: response.data.user.name,
        role: response.data.user.role,
        firmID: response.data.user.firmID,
      });

      alert("User registered successfully!");
    } catch (error: any) {
      console.error(
        "Registration error:",
        error.response?.data || error.message
      );
      alert(
        "Failed to register user: " +
          JSON.stringify(error.response?.data || error.message)
      );
    }
  };

  // Move to Register Case if user created
  if (showRegisterCase && createdUser) {
    return <RegisterCase user={createdUser} />;
  }

  return (
    <>
      <NavBarAdmin />

      <div className="admin-register-user-page">
        <h1>Register User</h1>

        {page === 1 && (
          <Page1Form
            fullName={fullName}
            setFullName={setFullName}
            age={age}
            setAge={setAge}
            gender={gender}
            setGender={setGender}
            identification={identification}
            setIdentification={setIdentification}
            maritalStatus={maritalStatus}
            setMaritalStatus={setMaritalStatus}
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            address={address}
            setAddress={setAddress}
          />
        )}

        {page === 2 && (
          <Page2Form
            username={username}
            setUsername={setUsername}
            password={password}
            setPassword={setPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            email={email}
            setEmail={setEmail}
            role={role}
            setRole={setRole}
            picture={picture}
            setPicture={setPicture}
          />
        )}

        <div className="admin-register-user-footer d-flex justify-content-between mt-4">
          <Pagination>
            <Pagination.Item
              active={page === 1}
              onClick={() => setPage(1)}
            >
              1
            </Pagination.Item>
            <Pagination.Item
              active={page === 2}
              onClick={() => setPage(2)}
            >
              2
            </Pagination.Item>
          </Pagination>

          {page === 2 && (
            <div className="admin-register-user-action-group d-flex gap-2">
              {/* Go to Register Case */}
              <button
                className="btn btn-primary"
                disabled={!createdUser}
                onClick={() => setShowRegisterCase(true)}
              >
                Go to Register Case
              </button>

              {/* Conditional Submit / Back Button */}
              {!createdUser ? (
                <button
                  className="btn btn-success"
                  onClick={handleSubmit}
                >
                  Submit
                </button>
              ) : (
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate(PATH.ADMIN.MANAGE_USER)}
                >
                  Back to User Table
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default RegisterUser;