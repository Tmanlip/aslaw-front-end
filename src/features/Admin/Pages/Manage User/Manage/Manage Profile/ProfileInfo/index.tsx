// src/components/ProfileInfo.tsx
import React, { useState } from "react";
import Pagination from "react-bootstrap/Pagination";
import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import { User } from "../../../../../../../data/userData"; // ✅ still using same interface

interface ProfileInfoProps {
  user: User;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({ user }) => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");

  const handleStatusChange = (newStatus: "Active" | "Inactive") => {
    setStatus(newStatus);
    alert(`Status changed to ${newStatus}`);
  };

  return (
    <div
      style={{
        marginTop: "1rem",
        textAlign: "left",
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "1rem",
        background: "#f9f9f9",
      }}
    >
      {page === 1 ? (
        <>
          <p>
            <strong>Name:</strong> {user.name}
          </p>
          <p>
            <strong>Age:</strong> {user.age}
          </p>

          <div style={{ marginTop: "1rem" }}>
            <Button
              variant="primary"
              onClick={() => alert("Edit Information clicked")}
            >
              Edit Information
            </Button>
          </div>
        </>
      ) : (
        <>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Username:</strong> {user.username}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            <span style={{ color: status === "Active" ? "green" : "red" }}>
              {status}
            </span>
          </p>

          <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
            {/* Dropdown to change status */}
            <Dropdown as={ButtonGroup}>
              <Button variant={status === "Active" ? "success" : "secondary"}>
                {status}
              </Button>
              <Dropdown.Toggle
                split
                variant={status === "Active" ? "success" : "secondary"}
                id="dropdown-split-basic"
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

            <Button
              variant="primary"
              onClick={() => alert("Edit Information clicked")}
            >
              Edit Information
            </Button>

            <Button
              variant="warning"
              onClick={() => alert("Reset Password clicked")}
            >
              Reset Password
            </Button>
          </div>
        </>
      )}

      <Pagination style={{ justifyContent: "center", marginTop: "1rem" }}>
        <Pagination.Item active={page === 1} onClick={() => setPage(1)}>
          1
        </Pagination.Item>
        <Pagination.Item active={page === 2} onClick={() => setPage(2)}>
          2
        </Pagination.Item>
      </Pagination>
    </div>
  );
};

export default ProfileInfo;