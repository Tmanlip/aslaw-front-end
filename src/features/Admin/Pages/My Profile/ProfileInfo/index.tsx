import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";

import { Lawyer } from "../../../../../data/userInfo";
import EditAdminModal from "./editProfile1";
import { updateUser } from "../../../../../hooks/user";
import AuthMemory from "../../../../../data/authMemory";
import AdminResetPasswordModal from "../ResetPassword/component";

interface ProfileInfoProps {
  admin: Lawyer;
  onAdminUpdated: (admin: Lawyer) => void;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({ admin, onAdminUpdated }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const renderAdminInfoCard = () => (
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
        <p><strong>Firm ID:</strong> {admin.firmID}</p>
        <p><strong>Full Name:</strong> {admin.name}</p>
        <p><strong>Username:</strong> {admin.username}</p>
        <p><strong>Email:</strong> {admin.email}</p>
        <p><strong>Phone Number:</strong> {admin.phoneNumber}</p>
        <p><strong>Home Address:</strong> {admin.HomeAddress}</p>
      </div>

      <div style={{ flex: "1 1 300px" }}>
        <p><strong>Age:</strong> {admin.age}</p>
        <p><strong>IC Number:</strong> {admin.ICNumber}</p>
        <p><strong>Gender:</strong> {admin.gender}</p>
        <p><strong>Marital Status:</strong> {admin.maritalStatus}</p>
        <p><strong>Status:</strong> {admin.status}</p>
        <p><strong>Role:</strong> {AuthMemory.getUser()?.role}</p>
        <p><strong>Created At:</strong> {admin.created_at}</p>
      </div>
    </div>
  );

  const handleSaveAdmin = async (updatedFields: Partial<Lawyer>) => {
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

      const response = await updateUser(admin.firmID, payload);
      const updatedAdmin: Lawyer = {
        ...admin,
        ...response.user,
      };

      onAdminUpdated(updatedAdmin);
      AuthMemory.setAuth(AuthMemory.getToken(), {
        ...AuthMemory.getUser(),
        ...response.user,
      });

      setShowEditModal(false);
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to update admin information");
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
      <h3>Admin Information</h3>
      {renderAdminInfoCard()}

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

      <EditAdminModal
        show={showEditModal}
        admin={admin}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveAdmin}
      />

      <AdminResetPasswordModal
        show={showResetModal}
        email={admin.email}
        firmID={admin.firmID}
        onClose={() => setShowResetModal(false)}
      />
    </div>
  );
};

export default ProfileInfo;
