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
    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap" }}>
      <span style={{ fontWeight: "bold", fontSize: "clamp(0.95rem, 2.2vw, 1rem)", lineHeight: 1.35 }}>
        {caseItem.title} ({caseItem.lawyerName})
      </span>
      <ProgressBar
        now={dummyProgress}
        label={`${dummyProgress}%`}
        style={{ width: "clamp(170px, 30vw, 230px)", height: "20px", fontSize: "0.9rem", flexShrink: 0 }}
      />
    </div>
  );
};

export default LawyerCaseProgress;