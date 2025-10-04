// src/pages/HomePage.tsx
import React, { useState } from "react";
import NavBarAdmin from "../../../../../shared/Navbar/NavBar Admin/new";
import Pagination from "react-bootstrap/Pagination";
import Page1Form from "./components/pageoneform";
import Page2Form from "./components/pagetwoform";
import RegisterCase from "./Register Case";

const RegisterUser: React.FC = () => {
  // Track whether user is on RegisterCase page
  const [showRegisterCase, setShowRegisterCase] = useState(false);

  // Page states
  const [page, setPage] = useState(1);

  // Page 1 states
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [identification, setIdentification] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");

  // Page 2 states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  const handleSubmit = () => {
    const formData = {
      fullName,
      age,
      identification,
      maritalStatus,
      username,
      password,
      email,
      role,
    };
    console.log("Submitted Data:", formData);
    alert("Form submitted! Check console for details.");
  };

  // ✅ If showRegisterCase is true, render RegisterCase component only
  if (showRegisterCase) {
    return <RegisterCase />;
  }

  return (
    <>
      {/* NavBar on top */}
      <NavBarAdmin />

      {/* Main content */}
      <div style={{ padding: "2rem" }}>
        <h1>Register User</h1>
        <p>Please fill out the details below:</p>

        {/* Page Forms */}
        {page === 1 && (
          <Page1Form
            fullName={fullName}
            setFullName={setFullName}
            age={age}
            setAge={setAge}
            identification={identification}
            setIdentification={setIdentification}
            maritalStatus={maritalStatus}
            setMaritalStatus={setMaritalStatus}
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

        {/* Pagination + Buttons */}
        <div className="d-flex justify-content-between align-items-center mt-4">
          <Pagination>
            <Pagination.Item active={page === 1} onClick={() => setPage(1)}>
              1
            </Pagination.Item>
            <Pagination.Item active={page === 2} onClick={() => setPage(2)}>
              2
            </Pagination.Item>
          </Pagination>

          {page === 2 && (
            <div className="d-flex gap-2">
              {/* Switch to RegisterCase */}
              <button
                className="btn btn-primary"
                onClick={() => setShowRegisterCase(true)}
              >
                Go to Register Case
              </button>

              {/* Submit form */}
              <button className="btn btn-success" onClick={handleSubmit}>
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
