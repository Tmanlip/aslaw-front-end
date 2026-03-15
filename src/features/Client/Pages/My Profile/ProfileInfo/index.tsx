import React, { useState, useEffect } from "react";
import Pagination from "react-bootstrap/Pagination";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";

import AuthMemory from "../../../../../data/authMemory";
import { Client, Case } from "../../../../../data/userInfo";
import EditClientModal from "./editProfile1";
import { updateUser } from "../../../../../hooks/user";
import ClientResetPasswordModal from "../ResetPassword/component"; // Import the reusable modal

const ProfileInfo: React.FC = () => {
  const [page, setPage] = useState(1);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const [client, setClient] = useState<Client | null>(null);
  const [cases, setCases] = useState<Case[] | null>(null);

  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);

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

  if (fetching) {
    return (
      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <Spinner
          animation="border"
          role="status"
          style={{ width: "60px", height: "60px" }}
        >
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p>Loading client information...</p>
      </div>
    );
  }

  if (!client) return <p>No client data available</p>;

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
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const renderClientInfoCard = () => (
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
        <p>
          <strong>Firm ID:</strong> {client.firmID}
        </p>
        <p>
          <strong>Full Name:</strong> {client.name}
        </p>
        <p>
          <strong>Username:</strong> {client.username}
        </p>
        <p>
          <strong>Email:</strong> {client.email}
        </p>
        <p>
          <strong>Phone Number:</strong> {client.phoneNumber}
        </p>
        <p>
          <strong>Home Address:</strong> {client.HomeAddress}
        </p>
      </div>

      <div style={{ flex: "1 1 300px" }}>
        <p>
          <strong>Age:</strong> {client.age}
        </p>
        <p>
          <strong>IC Number:</strong> {client.ICNumber}
        </p>
        <p>
          <strong>Gender:</strong> {client.gender}
        </p>
        <p>
          <strong>Marital Status:</strong> {client.maritalStatus}
        </p>
        <p>
          <strong>Status:</strong> {client.status}
        </p>
        <p>
          <strong>Role:</strong> {AuthMemory.getUser()?.role}
        </p>
        <p>
          <strong>Created At:</strong> {client.created_at}
        </p>
      </div>
    </div>
  );

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
          <h3>Client Information</h3>
          {renderClientInfoCard()}
          <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
            <Button
              variant="warning"
              onClick={() => setShowResetModal(true)}
            >
              Reset Password
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowClientModal(true)}
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
          {cases && cases.length > 0 ? (
            cases.map((c) => (
              <div
                key={c.caseId}
                style={{
                  marginBottom: "1rem",
                  padding: "1rem",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  background: "#fff",
                }}
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

      <Pagination style={{ justifyContent: "center", marginTop: "1rem" }}>
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
        onClose={() => setShowResetModal(false)}
      />
    </div>
  );
};

export default ProfileInfo;