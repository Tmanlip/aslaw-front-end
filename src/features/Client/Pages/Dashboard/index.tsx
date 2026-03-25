// src/pages/ClientDashboard.tsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NavBarClient from "../../../../shared/Navbar/NavBar Client/new";
import Alert from "react-bootstrap/Alert";
import AuthMemory from "../../../../data/authMemory";
import "./dashboard.css";

const ClientDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const successMessage = location.state?.successMessage || null;

  const [showAlert, setShowAlert] = useState(!!successMessage);
  const [user] = useState(AuthMemory.getUser());

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
        <div className="client-dashboard-alert-wrap">
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
      <div className="client-dashboard-page">
        <h1>Welcome, {user?.name || "Client"} 🎉</h1>
        <p>You can view your cases, appointments, and messages here.</p>
      </div>
    </>
  );
};

export default ClientDashboard;