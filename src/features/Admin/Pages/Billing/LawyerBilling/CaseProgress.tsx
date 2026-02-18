import React from "react";
import ProgressBar from "react-bootstrap/ProgressBar";
import { Case } from "../../../../../context/ClientDataContext";

interface CaseProgressProps {
  caseItem: Case;
}

const LawyerCaseProgress: React.FC<CaseProgressProps> = ({ caseItem }) => {
  // Dummy progress between 40-90%
  const dummyProgress = Math.floor(Math.random() * 50) + 40;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
      <span style={{ fontWeight: "bold", fontSize: "1rem" }}>
        {caseItem.title} ({caseItem.lawyerName})
      </span>
      <ProgressBar
        now={dummyProgress}
        label={`${dummyProgress}%`}
        style={{ width: "200px", height: "20px", fontSize: "0.9rem" }}
      />
    </div>
  );
};

export default LawyerCaseProgress;