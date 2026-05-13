// src/features/Lawyer/Pages/My Profile/ProfileInfo/index.tsx
import React, { useState } from "react";
import Pagination from "react-bootstrap/Pagination";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import { Form } from "react-bootstrap";
import { useLocation } from "react-router-dom";

import { Lawyer, Case, LawyerFullData } from "../../../../../data/userInfo";
import EditLawyerModal from "./editProfile1";
import { updateUser } from "../../../../../hooks/user";
import AuthMemory from "../../../../../data/authMemory";
import LawyerResetPasswordModal from "../ResetPassword/component";
import "./profileInfo.css";

interface ProfileInfoProps {
  fullData: LawyerFullData; // pass from LawyerProfile
}

const CaseSelector: React.FC<{ cases: Case[] }> = ({ cases }) => {
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0);
  const selectedCase = cases[selectedCaseIndex];

  return (
    <div>
      {cases.length > 1 && (
        <Form.Group className="lawyer-profile-case-filter">
          <Form.Label>Select Case:</Form.Label>
          <Form.Select
            value={selectedCaseIndex}
            onChange={(e) => setSelectedCaseIndex(Number(e.target.value))}
          >
            {cases.map((c, idx) => (
              <option key={c.caseId} value={idx}>
                {c.title}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      )}

      <div className="lawyer-profile-case-card">
        <p><strong>Case Title:</strong> {selectedCase.title || "-"}</p>
        <p><strong>Description:</strong> {selectedCase.description || "-"}</p>
        <p><strong>Status:</strong> {selectedCase.status || "-"}</p>
        <p><strong>Client:</strong> {selectedCase.clientName || "-"} | <strong>Lawyer:</strong> {selectedCase.lawyerName || "-"}</p>
        <p><strong>Created At:</strong> {selectedCase.created_at || "-"}</p>
      </div>
    </div>
  );
};

const ProfileInfo: React.FC<ProfileInfoProps> = ({ fullData }) => {
  const location = useLocation();
  const [page, setPage] = useState(1);
  const [lawyer, setLawyer] = useState<Lawyer>(fullData.lawyer);
  const [cases] = useState<Case[]>(fullData.cases || []);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const forceResetFromState = Boolean((location.state as any)?.forcePasswordReset);
  const mustChangePassword = Boolean(AuthMemory.getUser()?.must_change_password);

  React.useEffect(() => {
    if (forceResetFromState || mustChangePassword) {
      setShowResetModal(true);
    }
  }, [forceResetFromState, mustChangePassword]);

  const leftColumn = [
    { label: "Firm ID", value: lawyer.firmID },
    { label: "Full Name", value: lawyer.name },
    { label: "Username", value: lawyer.username },
    { label: "Email", value: lawyer.email },
    { label: "Phone Number", value: lawyer.phoneNumber },
    { label: "Home Address", value: lawyer.HomeAddress },
  ];

  const rightColumn = [
    { label: "Age", value: lawyer.age },
    { label: "IC Number", value: lawyer.ICNumber },
    { label: "Gender", value: lawyer.gender },
    { label: "Marital Status", value: lawyer.maritalStatus },
    { label: "Status", value: lawyer.status },
    { label: "Role", value: AuthMemory.getUser()?.role },
    { label: "Created At", value: lawyer.created_at },
  ];

  const renderLawyerInfoCard = () => (
    <div className="lawyer-profile-info-card">
      <div className="lawyer-profile-info-column">
        {leftColumn.map((item) => (
          <div className="lawyer-profile-info-row" key={item.label}>
            <span className="lawyer-profile-info-label">{item.label}</span>
            <span className="lawyer-profile-info-value">{item.value || "-"}</span>
          </div>
        ))}
      </div>

      <div className="lawyer-profile-info-column">
        {rightColumn.map((item) => (
          <div className="lawyer-profile-info-row" key={item.label}>
            <span className="lawyer-profile-info-label">{item.label}</span>
            <span className="lawyer-profile-info-value">{item.value || "-"}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const handleSaveLawyer = async (updatedFields: Partial<Lawyer>) => {
    try {
      setSaving(true);

      const payload: any = {
        name: updatedFields.name,
        username: updatedFields.username,
        email: updatedFields.email,
        phoneNumber: updatedFields.phoneNumber,
        HomeAddress: updatedFields.HomeAddress,
        age: updatedFields.age,
        ICNumber: updatedFields.ICNumber,
        gender: updatedFields.gender,
        maritalStatus: updatedFields.maritalStatus,
        status: updatedFields.status,
      };

      // Remove undefined keys so validation only runs for edited fields.
      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });

      const response = await updateUser(lawyer.firmID, payload);
      const updatedLawyer: Lawyer = response.user;

      setLawyer(updatedLawyer);

      // update AuthMemory if needed
      // @ts-ignore
      fullData && (fullData.lawyer = updatedLawyer);

      setShowEditModal(false);
      alert("Profile updated successfully!");
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to update lawyer information");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="lawyer-profile-info-shell">
      {page === 1 && (
        <>
          <h3 className="lawyer-profile-info-title">Lawyer Information</h3>
          {renderLawyerInfoCard()}

          <div className="lawyer-profile-action-row">
            <Button
              variant="warning"
              onClick={() => setShowResetModal(true)}
              className="lawyer-profile-action-btn"
            >
              Reset Password
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowEditModal(true)}
              disabled={saving}
              className="lawyer-profile-action-btn lawyer-profile-save-btn"
            >
              {saving && <Spinner animation="border" size="sm" role="status" />}
              {saving ? "Saving..." : "Edit Information"}
            </Button>
          </div>
        </>
      )}

      {page === 2 && (
        <>
          <h3 className="lawyer-profile-info-title">Cases</h3>
          {cases.length > 0 ? (
            <CaseSelector cases={cases} />
          ) : (
            <p>No cases found for this lawyer.</p>
          )}
        </>
      )}

      <Pagination className="lawyer-profile-pagination">
        <Pagination.Item active={page === 1} onClick={() => setPage(1)}>Lawyer Info</Pagination.Item>
        <Pagination.Item active={page === 2} onClick={() => setPage(2)}>Cases</Pagination.Item>
      </Pagination>

      <EditLawyerModal
        show={showEditModal}
        lawyer={lawyer}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveLawyer}
      />

      <LawyerResetPasswordModal
        show={showResetModal}
        email={lawyer.email}
        firmID={lawyer.firmID}
        forceReloginAfterReset={mustChangePassword}
        onClose={() => setShowResetModal(false)}
      />
    </div>
  );
};

export default ProfileInfo;