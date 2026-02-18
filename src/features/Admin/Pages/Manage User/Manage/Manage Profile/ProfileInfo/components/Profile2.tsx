// src/components/ProfileInfo/ProfileStatusPage.tsx
import React from "react";
import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import { User } from "../../../../../../../../context/ClientDataContext";

interface ProfileStatusPageProps {
  user: User;
  status: "Active" | "Inactive";
  setStatus: (status: "Active" | "Inactive") => void;
  onEdit: () => void;
}

const ProfileStatusPage: React.FC<ProfileStatusPageProps> = ({
  user,
  status,
  setStatus,
  onEdit,
}) => {
  const handleStatusChange = (newStatus: "Active" | "Inactive") => {
    setStatus(newStatus);
    alert(`Status changed to ${newStatus}`);
  };

  return (
    <>
      {/* User Information */}
      <p>
        <strong>Full Name:</strong> {user.name}
      </p>

      {user.email && (
        <p>
          <strong>Email:</strong> {user.email}
        </p>
      )}

      {user.username && (
        <p>
          <strong>Username:</strong> {user.username}
        </p>
      )}

      <hr />

      {/* Status Section */}
      <p>
        <strong>Status:</strong>{" "}
        <span style={{ color: status === "Active" ? "green" : "red" }}>
          {status}
        </span>
      </p>

      <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
        {/* Status Dropdown */}
        <Dropdown as={ButtonGroup}>
          <Button variant={status === "Active" ? "success" : "secondary"}>
            {status}
          </Button>

          <Dropdown.Toggle
            split
            variant={status === "Active" ? "success" : "secondary"}
          />

          <Dropdown.Menu>
            <Dropdown.Item onClick={() => handleStatusChange("Active")}>
              Active
            </Dropdown.Item>
            <Dropdown.Item onClick={() => handleStatusChange("Inactive")}>
              Inactive
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
          onClick={() => alert("Reset Password clicked")}
        >
          Reset Password
        </Button>
      </div>
    </>
  );
};

export default ProfileStatusPage;