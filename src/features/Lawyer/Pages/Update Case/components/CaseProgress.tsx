// src/components/CaseProgress.tsx
import React from "react";
import ProgressBar from "react-bootstrap/ProgressBar";
import { userData } from "../../../../../data/userData"; // adjust path if needed

const CaseProgress: React.FC = () => {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
      <span style={{ fontWeight: "bold", fontSize: "1.75rem" }}>
        {userData.name} Case
      </span>
      <ProgressBar
        now={userData.progress}
        label={`${userData.progress}%`}
        style={{ width: "300px", height: "28px", fontSize: "1rem" }}
      />
    </div>
  );
};

export default CaseProgress;