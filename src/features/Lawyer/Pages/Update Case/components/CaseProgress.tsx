import React from "react";
import ProgressBar from "react-bootstrap/ProgressBar";
import Form from "react-bootstrap/Form";
import { Case } from "../../../../../data/userInfo";

interface CaseProgressProps {
  cases: Case[];
  selectedCase: Case | null;
  onSelectCase: (c: Case) => void;
}

const toSafePercent = (value: unknown): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, numeric));
};

const CaseProgress: React.FC<CaseProgressProps> = ({ cases, selectedCase, onSelectCase }) => {
  const selectedCaseId = selectedCase?.caseId ?? (cases.length > 0 ? cases[0].caseId : null);
  const invoicePhases = selectedCase?.invoice_payment_phases;
  const invoicePhaseValues = invoicePhases
    ? (Object.values(invoicePhases) as Array<{ expected?: number; paid?: number }>)
    : [];
  const totalExpected = invoicePhaseValues.reduce((sum: number, phase) => sum + Number(phase?.expected ?? 0), 0);
  const totalPaid = invoicePhaseValues.reduce((sum: number, phase) => sum + Number(phase?.paid ?? 0), 0);
  const selectedCaseProgress = Number.isFinite(Number(selectedCase?.progress))
    ? toSafePercent(selectedCase?.progress)
    : totalExpected > 0
      ? toSafePercent((totalPaid / totalExpected) * 100)
      : 0;
  const progressValue = selectedCaseId ? selectedCaseProgress : 0;
  const progressLabel = progressValue === 0 ? "0%" : `${progressValue.toFixed(1)}%`;
  const caseTitle = (selectedCase as any)?.caseName || selectedCase?.title || "No Case Assigned";
  const caseParties = `${(selectedCase as any)?.clientName || "Client"} - ${(selectedCase as any)?.lawyerName || "Lawyer"}`;

  const handleSelect = (id: number) => {
    const c = cases.find((c) => c.caseId === id);
    if (c) onSelectCase(c);
  };

  if (cases.length === 0) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
      {cases.length > 1 ? (
        <Form.Select
          value={selectedCaseId ?? ""}
          onChange={(e) => handleSelect(Number(e.target.value))}
          style={{ width: "min(100%, 320px)" }}
        >
          {cases.map((c) => (
            <option key={c.caseId} value={c.caseId}>
              {c.title}
            </option>
          ))}
        </Form.Select>
      ) : (
        <span style={{ fontWeight: "bold", fontSize: "clamp(1rem, 2.6vw, 1.75rem)", lineHeight: 1.35 }}>
          {`${caseTitle} (${caseParties})`}
        </span>
      )}

      {cases.length > 1 && (
        <span style={{ fontWeight: "bold", fontSize: "clamp(1rem, 2.6vw, 1.75rem)", lineHeight: 1.35 }}>
          {`${caseTitle} (${caseParties})`}
        </span>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
        <ProgressBar
          now={progressValue}
          style={{ width: "clamp(180px, 32vw, 260px)", height: "20px", flexShrink: 0 }}
        />
        <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "#000", whiteSpace: "nowrap" }}>
          {progressLabel}
        </span>
      </div>
    </div>
  );
};

export default CaseProgress;