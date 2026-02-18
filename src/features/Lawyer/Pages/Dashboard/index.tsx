// src/pages/LawyerDashboard.tsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NavBarLawyer from "../../../../shared/Navbar/NavBar Lawyer/new";
import Alert from "react-bootstrap/Alert";
import AuthMemory from "../../../../data/authMemory";

const LawyerDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const successMessage = location.state?.successMessage || null;

  const [showAlert, setShowAlert] = useState(!!successMessage);
  const [user, setUser] = useState(AuthMemory.getUser());

  useEffect(() => {
    if (!AuthMemory.isLoggedIn() || user?.role !== "lawyer") {
      navigate("/login"); // redirect if not logged in or wrong role
    }
  }, [navigate, user]);

  useEffect(() => {
    if (successMessage) {
      setShowAlert(true);
      const timer = setTimeout(() => setShowAlert(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <>
      <NavBarLawyer />

      {/* Floating Alert */}
      {showAlert && successMessage && (
        <div
          style={{
            position: "fixed",
            top: "1rem",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1050,
            width: "auto",
            maxWidth: "600px",
          }}
        >
          <Alert
            variant="success"
            onClose={() => setShowAlert(false)}
            dismissible
          >
            {successMessage}
          </Alert>
        </div>
      )}

      {/* Main content */}
      <div style={{ padding: "2rem" }}>
        <h1>Welcome, {user?.name || "Lawyer"} 🎉</h1>
        <p>Here you can manage your assigned cases, client communication, and tasks.</p>
      </div>
    </>
  );
};

export default LawyerDashboard;