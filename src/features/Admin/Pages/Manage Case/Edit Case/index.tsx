import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import NavBarAdmin from "../../../../../shared/Navbar/NavBar Admin/new";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import { useClientData, Case } from "../../../../../context/ClientDataContext";
import EditCaseModal from "./EditCaseModal";

const EditCase: React.FC = () => {
  const location = useLocation();
  const { cases } = useClientData();
  
  const { selectedCase: stateCase, successMessage } = location.state || {};
  const [selectedCase, setSelectedCase] = useState<Case | null>(stateCase || null);

  const [showAlert, setShowAlert] = useState(!!successMessage);
  const [showModal, setShowModal] = useState(false);

  // Show success message alert
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

      {showAlert && (
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
          <Alert variant="success" onClose={() => setShowAlert(false)} dismissible>
            {successMessage || "Case updated successfully!"}
          </Alert>
        </div>
      )}

      <div style={{ padding: "2rem" }}>
        <h2>Manage Case</h2>

        {selectedCase ? (
          <div style={{ marginTop: "1.5rem" }}>
            <p><strong>Case ID:</strong> {selectedCase.caseId}</p>
            <p><strong>Title:</strong> {selectedCase.title}</p>
            <p><strong>Status:</strong> {selectedCase.status}</p>
            <p><strong>Client Name:</strong> {selectedCase.clientName}</p>
            <p><strong>Lawyer Name:</strong> {selectedCase.lawyerName}</p>
            {selectedCase.description && <p><strong>Description:</strong> {selectedCase.description}</p>}

            <Button
              variant="warning"
              style={{ marginTop: "1rem" }}
              onClick={() => setShowModal(true)}
            >
              Edit Case
            </Button>
          </div>
        ) : (
          <>
            <p style={{ marginTop: "1rem" }}>No case selected. Please select a case below:</p>
            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {cases.length > 0 ? (
                cases.map((c) => (
                  <Button
                    key={c.caseId}
                    variant="outline-primary"
                    onClick={() => setSelectedCase(c)}
                  >
                    {c.title} - {c.clientName}
                  </Button>
                ))
              ) : (
                <p>No cases available.</p>
              )}
            </div>
          </>
        )}
      </div>

      {selectedCase && (
        <EditCaseModal
          show={showModal}
          onClose={() => setShowModal(false)}
          selectedCase={selectedCase}
          setSelectedCase={setSelectedCase}
        />
      )}
    </>
  );
};

export default EditCase;