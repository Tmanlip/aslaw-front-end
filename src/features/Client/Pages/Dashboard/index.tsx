// src/pages/ClientDashboard.tsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NavBarClient from "../../../../shared/Navbar/NavBar Client/new";
import Alert from "react-bootstrap/Alert";
import AuthMemory from "../../../../data/authMemory";

const ClientDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const successMessage = location.state?.successMessage || null;

  const [showAlert, setShowAlert] = useState(!!successMessage);
  const [user, setUser] = useState(AuthMemory.getUser());

  useEffect(() => {
    if (!AuthMemory.isLoggedIn()) {
      // Redirect to login if no valid session
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (successMessage) {
      setShowAlert(true);
      const timer = setTimeout(() => setShowAlert(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <>
      <NavBarClient />

      {/* ✅ Floating Alert at top */}
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

      {/* ✅ Main content */}
      <div style={{ padding: "2rem" }}>
        <h1>Welcome, {user?.name || "Client"} 🎉</h1>
        <p>You can view your cases, appointments, and messages here.</p>
      </div>
    </>
  );
};

export default ClientDashboard;