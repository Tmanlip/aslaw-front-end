import React from "react";
import ProgressBar from "react-bootstrap/ProgressBar";
import { Case } from "../../../../../context/ClientDataContext";

interface CaseProgressProps {
  caseItem: Case;
  progressSourceLabel?: string;
}

const LawyerCaseProgress: React.FC<CaseProgressProps> = ({ caseItem, progressSourceLabel }) => {
  const invoicePhases = (caseItem as any).invoice_payment_phases;
  const invoicePhaseValues = invoicePhases
    ? (Object.values(invoicePhases) as Array<{ expected?: number; paid?: number }>)
    : [];
  const totalExpected = invoicePhaseValues.reduce((sum: number, phase) => sum + Number(phase?.expected ?? 0), 0);
  const totalPaid = invoicePhaseValues.reduce((sum: number, phase) => sum + Number(phase?.paid ?? 0), 0);
  const progress = totalExpected > 0
    ? Math.max(0, Math.min(100, (totalPaid / totalExpected) * 100))
    : 0;
  const progressLabel = progress === 0 ? "0%" : `${progress.toFixed(1)}%`;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap" }}>
      <span style={{ fontWeight: "bold", fontSize: "clamp(0.95rem, 2.2vw, 1rem)", lineHeight: 1.35 }}>
        {caseItem.title} ({caseItem.lawyerName})
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
        <ProgressBar
          now={progress}
          style={{ width: "clamp(170px, 30vw, 230px)", height: "20px", flexShrink: 0 }}
        />
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
          <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "#000", whiteSpace: "nowrap" }}>
            {progressLabel}
          </span>
          {progressSourceLabel ? (
            <span style={{ fontSize: "0.75rem", color: "#64748b", whiteSpace: "nowrap" }}>
              {progressSourceLabel}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default LawyerCaseProgress;