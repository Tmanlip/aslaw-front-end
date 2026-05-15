import React from "react";
import ProgressBar from "react-bootstrap/ProgressBar";
import { Case } from "../../../../../context/ClientDataContext";

interface CaseProgressProps {
  caseItem?: Case | null; // optional prop
  progressSourceLabel?: string;
}

const toSafePercent = (value: unknown): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, numeric));
};

const toLooseNumber = (value: unknown): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const normalized = String(value ?? "")
    .trim()
    .replace(/,/g, "")
    .replace(/%/g, "");

  if (!normalized) {
    return 0;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const CaseProgress: React.FC<CaseProgressProps> = ({ caseItem, progressSourceLabel }) => {
  if (!caseItem) return <p>No Case Selected</p>;

  const invoicePhases = (caseItem as any).invoice_payment_phases;
  const invoicePhaseValues = invoicePhases
    ? (Object.values(invoicePhases) as Array<{ expected?: number; paid?: number }>)
    : [];
  const totalExpected = invoicePhaseValues.reduce((sum: number, phase) => sum + toLooseNumber(phase?.expected), 0);
  const totalPaid = invoicePhaseValues.reduce((sum: number, phase) => sum + toLooseNumber(phase?.paid), 0);
  const progressValue = toLooseNumber((caseItem as any)?.progress);
  const progress = progressValue > 0
    ? toSafePercent(progressValue)
    : totalExpected > 0
      ? toSafePercent((totalPaid / totalExpected) * 100)
      : 0; // Force zero progress when there are no invoices
  const progressLabel = progress === 0 ? "0%" : `${progress.toFixed(1)}%`;

  // Use caseName if it exists (Case Table), otherwise fall back to title (lawyer/client)
  const caseTitle = (caseItem as any).caseName || (caseItem as any).title || "No Case Assigned";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
      <span style={{ fontWeight: "bold", fontSize: "clamp(1rem, 2.6vw, 1.75rem)", lineHeight: 1.35 }}>
        {`${caseTitle} (${caseItem.clientName} - ${caseItem.lawyerName})`}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
        <ProgressBar
          now={progress}
          style={{ width: "clamp(180px, 32vw, 260px)", height: "20px", flexShrink: 0 }}
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

export default CaseProgress;