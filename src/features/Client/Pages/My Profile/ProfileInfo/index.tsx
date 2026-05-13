import React, { useState, useEffect } from "react";
import Pagination from "react-bootstrap/Pagination";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import { useLocation } from "react-router-dom";

import AuthMemory from "../../../../../data/authMemory";
import { Client, Case } from "../../../../../data/userInfo";
import EditClientModal from "./editProfile1";
import { updateUser } from "../../../../../hooks/user";
import ClientResetPasswordModal from "../ResetPassword/component"; // Import the reusable modal
import "./profileInfo.css";

const ProfileInfo: React.FC = () => {
  const location = useLocation();
  const [page, setPage] = useState(1);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const [client, setClient] = useState<Client | null>(null);
  const [cases, setCases] = useState<Case[] | null>(null);

  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const forceResetFromState = Boolean((location.state as any)?.forcePasswordReset);
  const mustChangePassword = Boolean(AuthMemory.getUser()?.must_change_password);

  // Fetch client info (simulate async)
  useEffect(() => {
    setFetching(true);
    setTimeout(() => {
      const fullData = AuthMemory.getClientFullData();
      setClient(fullData?.client ?? null);
      setCases(fullData?.cases ?? null);
      setFetching(false);
    }, 500);
  }, []);

  useEffect(() => {
    if (client && (forceResetFromState || mustChangePassword)) {
      setShowResetModal(true);
    }
  }, [client, forceResetFromState, mustChangePassword]);

  if (fetching) {
    return (
      <div className="client-profile-loading-wrap">
        <Spinner
          animation="border"
          role="status"
          className="client-profile-loading-spinner"
        >
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p>Loading client information...</p>
      </div>
    );
  }

  if (!client) return <p>No client data available</p>;

  const leftColumn = [
    { label: "Firm ID", value: client.firmID },
    { label: "Full Name", value: client.name },
    { label: "Username", value: client.username },
    { label: "Email", value: client.email },
    { label: "Phone Number", value: client.phoneNumber },
    { label: "Home Address", value: client.HomeAddress },
  ];

  const rightColumn = [
    { label: "Age", value: client.age },
    { label: "IC Number", value: client.ICNumber },
    { label: "Gender", value: client.gender },
    { label: "Marital Status", value: client.maritalStatus },
    { label: "Status", value: client.status },
    { label: "Role", value: AuthMemory.getUser()?.role },
    { label: "Created At", value: client.created_at },
  ];

  const handleSaveClient = async (updatedFields: Partial<Client>) => {
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

      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });

      const data = await updateUser(client.firmID, payload);
      const updatedClient: Client = data.user;

      setClient(updatedClient);

      const fullData = AuthMemory.getClientFullData();
      if (fullData) {
        AuthMemory.setClientFullData({ ...fullData, client: updatedClient });
      }

      setShowClientModal(false);
      alert("Profile updated successfully!");
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const renderClientInfoCard = () => (
    <div className="client-profile-info-card">
      <div className="client-profile-info-column">
        {leftColumn.map((item) => (
          <div className="client-profile-info-row" key={item.label}>
            <span className="client-profile-info-label">{item.label}</span>
            <span className="client-profile-info-value">{item.value || "-"}</span>
          </div>
        ))}
      </div>

      <div className="client-profile-info-column">
        {rightColumn.map((item) => (
          <div className="client-profile-info-row" key={item.label}>
            <span className="client-profile-info-label">{item.label}</span>
            <span className="client-profile-info-value">{item.value || "-"}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="client-profile-info-shell">
      {page === 1 && (
        <>
          <h3 className="client-profile-info-title">Client Information</h3>
          {renderClientInfoCard()}
          <div className="client-profile-action-row">
            <Button
              variant="warning"
              onClick={() => setShowResetModal(true)}
              className="client-profile-action-btn"
            >
              Reset Password
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowClientModal(true)}
              disabled={saving}
              className="client-profile-action-btn client-profile-save-btn"
            >
              {saving && <Spinner animation="border" size="sm" role="status" />}
              {saving ? "Saving..." : "Edit Information"}
            </Button>
          </div>
        </>
      )}

      {page === 2 && (
        <>
          <h3 className="client-profile-info-title">Cases</h3>
          {cases && cases.length > 0 ? (
            cases.map((c) => (
              <div
                key={c.caseId}
                className="client-profile-case-card"
              >
                <p>
                  <strong>Case Title:</strong> {c.title}
                </p>
                <p>
                  <strong>Description:</strong> {c.description}
                </p>
                <p>
                  <strong>Status:</strong> {c.status}
                </p>
                <p>
                  <strong>Client:</strong> {c.clientName} |{" "}
                  <strong>Lawyer:</strong> {c.lawyerName}
                </p>
                <p>
                  <strong>Created At:</strong> {c.created_at}
                </p>
              </div>
            ))
          ) : (
            <p>No cases found for this client.</p>
          )}
        </>
      )}

      <Pagination className="client-profile-pagination">
        <Pagination.Item active={page === 1} onClick={() => setPage(1)}>
          Client Info
        </Pagination.Item>
        <Pagination.Item active={page === 2} onClick={() => setPage(2)}>
          Cases
        </Pagination.Item>
      </Pagination>

      {/* Edit Client Modal */}
      <EditClientModal
        show={showClientModal}
        client={client}
        onClose={() => setShowClientModal(false)}
        onSave={handleSaveClient}
      />

      {/* Reset Password Modal (reusable component) */}
      <ClientResetPasswordModal
        show={showResetModal}
        email={client.email}
        firmID={client.firmID}
        forceReloginAfterReset={mustChangePassword}
        onClose={() => setShowResetModal(false)}
      />
    </div>
  );
};

export default ProfileInfo;