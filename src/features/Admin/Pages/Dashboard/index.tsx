// src/pages/HomePage.tsx
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import NavBarAdmin from "../../../../shared/Navbar/NavBar Admin/new";
import Alert from "react-bootstrap/Alert";

const AdminDashboard: React.FC = () => {
  // ✅ Get success message from navigation state
  const location = useLocation();
  const successMessage = location.state?.successMessage || null;

  const [showAlert, setShowAlert] = useState(!!successMessage);

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

      {/* ✅ Floating Alert at top */}
      {showAlert && successMessage && (
        <div
          style={{
            position: "fixed",
            top: "1rem",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1050, // stays above everything
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
        <h1>Welcome to MyApp 🎉</h1>
        <p>This is the homepage. You can navigate using the navbar links above.</p>
      </div>
    </>
  );
};

export default AdminDashboard;