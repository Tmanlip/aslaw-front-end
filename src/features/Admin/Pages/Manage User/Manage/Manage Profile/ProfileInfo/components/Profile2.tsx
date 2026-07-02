// src/components/ProfileInfo/ProfileStatusPage.tsx
import React from "react";
import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import { User } from "../../../../../../../../context/ClientDataContext";

interface ProfileStatusPageProps {
  user: User;
  status: "Active" | "Inactive" | "Archived";
  setStatus: (status: "Active" | "Inactive" | "Archived") => void;
  onEdit: () => void;
  onStatusSave: (newStatus: "Active" | "Inactive" | "Archived") => Promise<void>;
  onResetPassword: () => Promise<void>;
}

const ProfileStatusPage: React.FC<ProfileStatusPageProps> = ({
  user,
  status,
  setStatus,
  onEdit,
  onStatusSave,
  onResetPassword,
}) => {
  const [isSaving, setIsSaving] = React.useState(false);
  const [isResettingPassword, setIsResettingPassword] = React.useState(false);

  const handleStatusChange = async (newStatus: "Active" | "Inactive" | "Archived") => {
    setIsSaving(true);
    try {
      await onStatusSave(newStatus);
      setStatus(newStatus);
      alert(`Status changed to ${newStatus}`);
    } catch (error) {
      alert("Failed to save status change.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPasswordClick = async () => {
    setIsResettingPassword(true);
    try {
      await onResetPassword();
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="admin-profile-page-card">
      <div className="admin-profile-page-header">
        <h4>Status & Access</h4>
        <p className="admin-profile-page-subtitle">Account visibility and profile actions</p>
      </div>

      <div className="admin-profile-field-list">
        <div className="admin-profile-field-item">
          <p className="admin-profile-field-label">Full Name</p>
          <p className="admin-profile-field-value">{user.name}</p>
        </div>

        {user.email && (
          <div className="admin-profile-field-item">
            <p className="admin-profile-field-label">Email</p>
            <p className="admin-profile-field-value">{user.email}</p>
          </div>
        )}

        {user.username && (
          <div className="admin-profile-field-item">
            <p className="admin-profile-field-label">Username</p>
            <p className="admin-profile-field-value">{user.username}</p>
          </div>
        )}

        <div className="admin-profile-field-item">
          <p className="admin-profile-field-label">Current Status</p>
          <p className="admin-profile-field-value">
            <span className={`admin-profile-status-chip ${status === "Active" ? "is-active" : status === "Inactive" ? "is-inactive" : "is-archived"}`}>
              {status}
            </span>
          </p>
        </div>
      </div>

      <div className="admin-profile-actions">
        {/* Status Dropdown */}
        <Dropdown as={ButtonGroup} disabled={isSaving}>
          <Button variant={status === "Active" ? "success" : status === "Inactive" ? "secondary" : "dark"} disabled={isSaving}>
            {isSaving ? "Saving..." : status}
          </Button>

          <Dropdown.Toggle
            split
            variant={status === "Active" ? "success" : status === "Inactive" ? "secondary" : "dark"}
            disabled={isSaving}
          />

          <Dropdown.Menu>
            <Dropdown.Item onClick={() => handleStatusChange("Active")}>
              Active
            </Dropdown.Item>
            <Dropdown.Item onClick={() => handleStatusChange("Inactive")}>
              Inactive
            </Dropdown.Item>
            <Dropdown.Item onClick={() => handleStatusChange("Archived")}>
              Archived
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>

        {/* Edit Button */}
        <Button variant="primary" onClick={onEdit}>
          Edit Information
        </Button>

        {/* Reset Password */}
        <Button
          variant="warning"
          onClick={() => void handleResetPasswordClick()}
          disabled={isResettingPassword}
        >
          {isResettingPassword ? "Resetting..." : "Reset Password"}
        </Button>
      </div>
    </div>
  );
};

export default ProfileStatusPage;