// src/pages/LawyerDashboard.tsx
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import NavBarLawyer from "../../../../shared/Navbar/NavBar Lawyer/new";
import Alert from "react-bootstrap/Alert";

const LawyerDashboard: React.FC = () => {
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
      <NavBarLawyer />

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
        <h1>Welcome, Lawyer 🎉</h1>
        <p>Here you can manage your assigned cases, client communication, and tasks.</p>
      </div>
    </>
  );
};

export default LawyerDashboard;