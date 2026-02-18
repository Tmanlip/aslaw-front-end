// src/components/CaseProgress.tsx
import React from "react";
import ProgressBar from "react-bootstrap/ProgressBar";
import { userData } from "../../../../../data/userData"; // keep this for progress
import AuthMemory from "../../../../../data/authMemory"; // for client case name

const CaseProgress: React.FC = () => {
  // Get the client's full data
  const clientData = AuthMemory.getClientFullData();

  // Get the first case safely
  const firstCase = clientData?.cases?.[0];

  // Use the case name if available, fallback to userData.name
  const caseName = firstCase?.title || userData.name;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
      <span style={{ fontWeight: "bold", fontSize: "1.75rem" }}>
        {caseName} Case
      </span>
      <ProgressBar
        now={userData.progress} // keep progress from userData
        label={`${userData.progress}%`}
        style={{ width: "300px", height: "28px", fontSize: "1rem" }}
      />
    </div>
  );
};

export default CaseProgress;