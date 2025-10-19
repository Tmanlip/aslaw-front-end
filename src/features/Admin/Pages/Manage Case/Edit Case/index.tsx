import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import NavBarAdmin from "../../../../../shared/Navbar/NavBar Admin/new";
import Alert from "react-bootstrap/Alert";

const EditCase: React.FC = () => {
  const location = useLocation();

  // ✅ Get case data and success message from navigation
  const { caseData, successMessage } = location.state || {
    caseData: null,
    successMessage: null,
  };

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

      {/* ✅ Floating success alert */}
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

      {/* ✅ Case Details Section */}
      <div style={{ padding: "2rem" }}>
        <h2>Manage Case</h2>

        {caseData ? (
          <div style={{ marginTop: "1.5rem" }}>
            <p><strong>Case ID:</strong> {caseData.id}</p>
            <p><strong>Client Name:</strong> {caseData.clientName}</p>
            <p><strong>Lawyer Name:</strong> {caseData.lawyerName}</p>
            <p><strong>Case Name:</strong> {caseData.caseName}</p>
          </div>
        ) : (
          <p>No case data provided. Please go back and select a case.</p>
        )}
      </div>
    </>
  );
};

export default EditCase;