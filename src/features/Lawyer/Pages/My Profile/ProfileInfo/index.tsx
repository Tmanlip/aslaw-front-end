// src/features/Lawyer/Pages/My Profile/ProfileInfo/index.tsx
import React, { useState } from "react";
import Pagination from "react-bootstrap/Pagination";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import { Form } from "react-bootstrap";

import { Lawyer, Case, LawyerFullData } from "../../../../../data/userInfo";
import EditLawyerModal from "./editProfile1";
import { updateUser } from "../../../../../hooks/user";
import AuthMemory from "../../../../../data/authMemory";
import LawyerResetPasswordModal from "../ResetPassword/component";

interface ProfileInfoProps {
  fullData: LawyerFullData; // pass from LawyerProfile
}

const CaseSelector: React.FC<{ cases: Case[] }> = ({ cases }) => {
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0);
  const selectedCase = cases[selectedCaseIndex];

  return (
    <div>
      {cases.length > 1 && (
        <Form.Group style={{ marginBottom: "1rem" }}>
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

      <div
        style={{
          marginBottom: "1rem",
          padding: "1rem",
          border: "1px solid #ccc",
          borderRadius: "6px",
          background: "#fff",
        }}
      >
        <p><strong>Case Title:</strong> {selectedCase.title}</p>
        <p><strong>Description:</strong> {selectedCase.description}</p>
        <p><strong>Status:</strong> {selectedCase.status}</p>
        <p>
          <strong>Client:</strong> {selectedCase.clientName} |{" "}
          <strong>Lawyer:</strong> {selectedCase.lawyerName}
        </p>
        <p><strong>Created At:</strong> {selectedCase.created_at}</p>
      </div>
    </div>
  );
};

const ProfileInfo: React.FC<ProfileInfoProps> = ({ fullData }) => {
  const [page, setPage] = useState(1);
  const [lawyer, setLawyer] = useState<Lawyer>(fullData.lawyer);
  const [cases, setCases] = useState<Case[]>(fullData.cases || []);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const renderLawyerInfoCard = () => (
    <div
      style={{
        display: "flex",
        gap: "1.5rem",
        padding: "1rem",
        border: "1px solid #ccc",
        borderRadius: "6px",
        background: "#fff",
        flexWrap: "wrap",
      }}
    >
      <div style={{ flex: "1 1 300px" }}>
        <p><strong>Firm ID:</strong> {lawyer.firmID}</p>
        <p><strong>Full Name:</strong> {lawyer.name}</p>
        <p><strong>Username:</strong> {lawyer.username}</p>
        <p><strong>Email:</strong> {lawyer.email}</p>
        <p><strong>Phone Number:</strong> {lawyer.phoneNumber}</p>
        <p><strong>Home Address:</strong> {lawyer.HomeAddress}</p>
      </div>

      <div style={{ flex: "1 1 300px" }}>
        <p><strong>Age:</strong> {lawyer.age}</p>
        <p><strong>IC Number:</strong> {lawyer.ICNumber}</p>
        <p><strong>Gender:</strong> {lawyer.gender}</p>
        <p><strong>Marital Status:</strong> {lawyer.maritalStatus}</p>
        <p><strong>Status:</strong> {lawyer.status}</p>
        <p><strong>Role:</strong> {AuthMemory.getUser()?.role}</p>
        <p><strong>Created At:</strong> {lawyer.created_at}</p>
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
      const full = { lawyer: updatedLawyer, cases };
      // @ts-ignore
      fullData && (fullData.lawyer = updatedLawyer);

      setShowEditModal(false);
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to update lawyer information");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        marginTop: "1rem",
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "1rem",
        background: "#f9f9f9",
      }}
    >
      {page === 1 && (
        <>
          <h3>Lawyer Information</h3>
          {renderLawyerInfoCard()}

          <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
            <Button
              variant="warning"
              onClick={() => setShowResetModal(true)}
            >
              Reset Password
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowEditModal(true)}
              disabled={saving}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              {saving && <Spinner animation="border" size="sm" role="status" />}
              {saving ? "Saving..." : "Edit Information"}
            </Button>
          </div>
        </>
      )}

      {page === 2 && (
        <>
          <h3>Cases</h3>
          {cases.length > 0 ? (
            <CaseSelector cases={cases} />
          ) : (
            <p>No cases found for this lawyer.</p>
          )}
        </>
      )}

      <Pagination style={{ justifyContent: "center", marginTop: "1rem" }}>
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
        onClose={() => setShowResetModal(false)}
      />
    </div>
  );
};

export default ProfileInfo;