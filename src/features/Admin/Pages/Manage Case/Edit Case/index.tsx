import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import NavBarAdmin from "../../../../../shared/Navbar/NavBar Admin/new";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import axiosUser from "../../../../../api/axiosUser";
import { useClientData, Case } from "../../../../../context/ClientDataContext";
import EditCaseModal from "./EditCaseModal";
import "./editCase.css";

const EditCase: React.FC = () => {
  const location = useLocation();
  const { cases } = useClientData();
  
  const {
    selectedCase: stateCase,
    successMessage,
    editMode,
    autoStartEdit,
  } = location.state || {};
  const [selectedCase, setSelectedCase] = useState<Case | null>(stateCase || null);
  const selectedCaseId = Number((selectedCase as any)?.caseId ?? (selectedCase as any)?.id ?? 0);

  const [showAlert, setShowAlert] = useState(!!successMessage);

  // Show success message alert
  useEffect(() => {
    if (successMessage) {
      setShowAlert(true);
      const timer = setTimeout(() => setShowAlert(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    const refreshSelectedCase = async () => {
      if (!selectedCaseId) return;

      try {
        const response = await axiosUser.get(`/cases`);
        const list = Array.isArray(response.data) ? response.data : [];
        const latestCase = list.find((item: any) => Number(item.caseId ?? item.id) === selectedCaseId);
        if (latestCase) {
          setSelectedCase((prev) => ({
            ...(prev || ({} as Case)),
            ...latestCase,
            caseId: Number(latestCase.caseId ?? latestCase.id ?? selectedCaseId),
            title: latestCase.title || latestCase.caseName || prev?.title || "",
          } as Case));
        }
      } catch (error) {
        console.error("Failed to refresh selected case in Edit Case", error);
      }
    };

    refreshSelectedCase();
  }, [selectedCaseId]);

  return (
    <>
      <NavBarAdmin />

      {showAlert && (
        <div className="admin-edit-case-alert-wrap">
          <Alert variant="success" onClose={() => setShowAlert(false)} dismissible>
            {successMessage || "Case updated successfully!"}
          </Alert>
        </div>
      )}

      <div className="admin-edit-case-page">
        <h2>Manage Case</h2>

        {selectedCase ? (
          <EditCaseModal
            selectedCase={selectedCase}
            setSelectedCase={setSelectedCase}
            editMode={editMode === "lawyerOnly" ? "lawyerOnly" : "full"}
            autoStartEdit={Boolean(autoStartEdit)}
          />
        ) : (
          <>
            <p className="admin-edit-case-empty-text">No case selected. Please select a case below:</p>
            <div className="admin-edit-case-selector-list">
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
    </>
  );
};

export default EditCase;
