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
    <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
      <span style={{ fontWeight: "bold", fontSize: "1.75rem" }}>
        {`${caseTitle} (${caseItem.clientName} - ${caseItem.lawyerName})`}
      </span>
      <ProgressBar
        now={dummyProgress}
        label={`${dummyProgress}%`}
        style={{ width: "200px", height: "20px", fontSize: "0.9rem" }}
      />
    </div>
  );
};

export default CaseProgress;