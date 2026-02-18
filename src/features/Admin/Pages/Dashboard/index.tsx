// src/pages/HomePage.tsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NavBarAdmin from "../../../../shared/Navbar/NavBar Admin/new";
import Alert from "react-bootstrap/Alert";
import AuthMemory from "../../../../data/authMemory";

const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const successMessage = location.state?.successMessage || null;

  const [showAlert, setShowAlert] = useState(!!successMessage);
  const [user, setUser] = useState(AuthMemory.getUser());

  useEffect(() => {
    if (!AuthMemory.isLoggedIn() || user?.role !== "admin") {
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
      <NavBarAdmin />

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
        <h1>Welcome, {user?.name || "Admin"} 🎉</h1>
        <p>This is your admin dashboard. You can manage users, cases, and settings here.</p>
      </div>
    </>
  );
};

export default AdminDashboard;