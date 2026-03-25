import React from "react";
import ProgressBar from "react-bootstrap/ProgressBar";
import { Case } from "../../../../../context/ClientDataContext";

interface CaseProgressProps {
  caseItem?: Case | null; // optional prop
}

const CaseProgress: React.FC<CaseProgressProps> = ({ caseItem }) => {
  if (!caseItem) return <p>No Case Selected</p>;

  // Dummy progress between 40-90%
  const dummyProgress = Math.floor(Math.random() * 50) + 40;

  // Use caseName if it exists (Case Table), otherwise fall back to title (lawyer/client)
  const caseTitle = (caseItem as any).caseName || (caseItem as any).title || "No Case Assigned";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
      <span style={{ fontWeight: "bold", fontSize: "clamp(1rem, 2.6vw, 1.75rem)", lineHeight: 1.35 }}>
        {`${caseTitle} (${caseItem.clientName} - ${caseItem.lawyerName})`}
      </span>
      <ProgressBar
        now={dummyProgress}
        label={`${dummyProgress}%`}
        style={{ width: "clamp(180px, 32vw, 260px)", height: "20px", fontSize: "0.9rem", flexShrink: 0 }}
      />
    </div>
  );
};

export default CaseProgress;