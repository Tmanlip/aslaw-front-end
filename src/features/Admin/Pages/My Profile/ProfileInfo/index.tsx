import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";

import { Lawyer } from "../../../../../data/userInfo";
import EditAdminModal from "./editProfile1";
import { updateUser } from "../../../../../hooks/user";
import AuthMemory from "../../../../../data/authMemory";
import AdminResetPasswordModal from "../ResetPassword/component";
import "./profileInfo.css";

interface ProfileInfoProps {
  admin: Lawyer;
  onAdminUpdated: (admin: Lawyer) => void;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({ admin, onAdminUpdated }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const leftColumn = [
    { label: "Firm ID", value: admin.firmID },
    { label: "Full Name", value: admin.name },
    { label: "Username", value: admin.username },
    { label: "Email", value: admin.email },
    { label: "Phone Number", value: admin.phoneNumber },
    { label: "Home Address", value: admin.HomeAddress },
  ];

  const rightColumn = [
    { label: "Age", value: admin.age },
    { label: "IC Number", value: admin.ICNumber },
    { label: "Gender", value: admin.gender },
    { label: "Marital Status", value: admin.maritalStatus },
    { label: "Status", value: admin.status },
    { label: "Role", value: AuthMemory.getUser()?.role },
    { label: "Created At", value: admin.created_at },
  ];

  const renderAdminInfoCard = () => (
    <div className="admin-profile-info-card">
      <div className="admin-profile-info-column">
        {leftColumn.map((item) => (
          <div className="admin-profile-info-row" key={item.label}>
            <span className="admin-profile-info-label">{item.label}</span>
            <span className="admin-profile-info-value">{item.value || "-"}</span>
          </div>
        ))}
      </div>

      <div className="admin-profile-info-column">
        {rightColumn.map((item) => (
          <div className="admin-profile-info-row" key={item.label}>
            <span className="admin-profile-info-label">{item.label}</span>
            <span className="admin-profile-info-value">{item.value || "-"}</span>
          </div>
        ))}
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
      alert("Profile updated successfully!");
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to update admin information");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-profile-info-shell">
      <h3 className="admin-profile-info-title">Admin Information</h3>
      {renderAdminInfoCard()}

      <div className="admin-profile-action-row">
        <Button
          variant="warning"
          onClick={() => setShowResetModal(true)}
          className="admin-profile-action-btn"
        >
          Reset Password
        </Button>
        <Button
          variant="primary"
          onClick={() => setShowEditModal(true)}
          disabled={saving}
          className="admin-profile-action-btn admin-profile-save-btn"
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
