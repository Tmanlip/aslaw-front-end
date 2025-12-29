// src/pages/HomePage.tsx
import React, { useState } from "react";
import NavBarAdmin from "../../../../../shared/Navbar/NavBar Admin/new";
import Pagination from "react-bootstrap/Pagination";
import axios from "axios";
import Page1Form from "./components/pageoneform";
import Page2Form from "./components/pagetwoform";
import RegisterCase from "./Register Case";
import { UserRole } from "../../../../../constant/user";

type CreatedUser = {
  id: number;
  name: string;
  role: UserRole;
  firmID: string;
};

const RegisterUser: React.FC = () => {
  const [page, setPage] = useState(1);
  const [showRegisterCase, setShowRegisterCase] = useState(false);

  // Page 1 state
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | "">("");
  const [identification, setIdentification] = useState("");
  const [maritalStatus, setMaritalStatus] = useState<"Single" | "Married" | "Divorce" | "">("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");

  // Page 2 state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "lawyer" | "client" | "">("");

  // Created user
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null);

  const handleSubmit = async () => {
    try {
      // Convert age to number and validate
      const ageNumber = parseInt(age, 10);
      if (isNaN(ageNumber)) {
        alert("Age must be a number");
        return;
      }

      if (!gender || !maritalStatus || !role) {
        alert("Please select all dropdowns correctly");
        return;
      }

      const payload = {
        name: fullName,
        email,
        username,
        password,
        role,
        age: ageNumber,
        ICNumber: identification,
        phoneNumber,
        HomeAddress: address,
        gender,
        maritalStatus,
      };

      console.log("Submitting payload:", payload);

      const response = await axios.post("http://127.0.0.1:8000/api/registerusers", payload);

      setCreatedUser({
        id: response.data.user.id,
        name: response.data.user.name,
        role: response.data.user.role,
        firmID: response.data.user.firmID,
      });

      alert("User registered successfully!");
    } catch (error: any) {
      console.error("Registration error:", error.response?.data || error.message);
      alert("Failed to register user: " + JSON.stringify(error.response?.data || error.message));
    }
  };

  // Move to Register Case if user created
  if (showRegisterCase && createdUser) {
    return <RegisterCase user={createdUser} />;
  }

  return (
    <>
      <NavBarAdmin />

      <div style={{ padding: "2rem" }}>
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
          />
        )}

        <div className="d-flex justify-content-between mt-4">
          <Pagination>
            <Pagination.Item active={page === 1} onClick={() => setPage(1)}>1</Pagination.Item>
            <Pagination.Item active={page === 2} onClick={() => setPage(2)}>2</Pagination.Item>
          </Pagination>

          {page === 2 && (
            <div className="d-flex gap-2">
              <button
                className="btn btn-primary"
                disabled={!createdUser}
                onClick={() => setShowRegisterCase(true)}
              >
                Go to Register Case
              </button>

              <button
                className="btn btn-success"
                onClick={handleSubmit}
              >
                Submit
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default RegisterUser;