import React, { useMemo, useState } from "react";
import "./styles.css";

export type InvoiceStage = "initial" | "first" | "second" | "third" | "final";

type InvoicePhase = { expected?: number; paid?: number; balance?: number };

type PracticeAreaItem = {
  practiceArea?: string;
  typeOfWork?: string;
  selectedFee?: number;
  estimationFeesRange?: string;
};

type CaseTypeFeeJson = Partial<Record<InvoiceStage, PracticeAreaItem[]>>;

type InvoicePhaseSummaryProps = {
  expectedPaymentPhases?: Partial<Record<InvoiceStage, number>> | null;
  invoicePaymentPhases?: Partial<Record<InvoiceStage, InvoicePhase>> | null;
  selectedStage?: string;
  accentColor?: string;
  caseTypeFeeJson?: CaseTypeFeeJson | null;
};

const STAGES: InvoiceStage[] = ["initial", "first", "second", "third", "final"];

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatStageLabel = (stage: string) => stage.charAt(0).toUpperCase() + stage.slice(1);

const InvoicePhaseSummary: React.FC<InvoicePhaseSummaryProps> = ({
  expectedPaymentPhases,
  invoicePaymentPhases,
  selectedStage,
  accentColor = "#b91c1c",
  caseTypeFeeJson,
}) => {
  const [showPopup, setShowPopup] = useState(false);
  const [expandedPhase, setExpandedPhase] = useState<InvoiceStage | null>(null);

  const normalizedSelectedStage = useMemo<InvoiceStage | null>(() => {
    const candidate = String(selectedStage || "").toLowerCase();
    return STAGES.includes(candidate as InvoiceStage) ? (candidate as InvoiceStage) : null;
  }, [selectedStage]);

  const summaries = useMemo(() => {
    return STAGES.map((stage) => {
      const stageSummary = invoicePaymentPhases?.[stage];
      const expectedFallback = Number(expectedPaymentPhases?.[stage] ?? 0);
      const expected =
        Number(stageSummary?.expected ?? 0) > 0
          ? Number(stageSummary?.expected ?? 0)
          : expectedFallback;
      const paid = Number(stageSummary?.paid ?? 0);
      const balance =
        stageSummary?.balance !== undefined && stageSummary?.balance !== null
          ? Number(stageSummary.balance)
          : Math.max(expected - paid, 0);

      return { stage, expected, paid, balance };
    });
  }, [expectedPaymentPhases, invoicePaymentPhases]);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowPopup(true)}
        className="invoice-phase-summary-trigger"
        style={{ "--invoice-phase-accent": accentColor } as React.CSSProperties}
      >
        <div className="invoice-phase-summary-title">Phase Summary</div>
        <div className="invoice-phase-summary-subtitle">
          <span>Click to view full phase progression.</span>
          {normalizedSelectedStage && (
            <span>Selected upload phase: {formatStageLabel(normalizedSelectedStage)}</span>
          )}
        </div>
      </button>

      {showPopup && (
        <div
          className="invoice-phase-summary-overlay"
          onClick={() => setShowPopup(false)}
        >
          <div
            className="invoice-phase-summary-modal"
            style={{ "--invoice-phase-accent": accentColor } as React.CSSProperties}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="invoice-phase-summary-header">
              <h3>Phase Summary</h3>
              <button
                type="button"
                onClick={() => setShowPopup(false)}
                className="invoice-phase-summary-close"
              >
                Close
              </button>
            </div>

            <div className="invoice-phase-summary-grid invoice-phase-summary-grid-head">
              <div>Phase</div>
              <div>Expected (RM)</div>
              <div>Paid (RM)</div>
              <div>Balance (RM)</div>
            </div>

            <div className="invoice-phase-summary-rows">
              {summaries.map((summary) => {
                const practices = caseTypeFeeJson?.[summary.stage as InvoiceStage] || [];
                const isExpanded = expandedPhase === summary.stage;
                return (
                  <div key={summary.stage}>
                    <div
                      className={`invoice-phase-summary-grid invoice-phase-summary-row ${summary.stage === normalizedSelectedStage ? "is-selected" : ""}`}
                      style={{ cursor: practices.length > 0 ? "pointer" : "default" }}
                      onClick={() => {
                        if (practices.length > 0) {
                          setExpandedPhase(isExpanded ? null : (summary.stage as InvoiceStage));
                        }
                      }}
                    >
                      <strong>
                        {formatStageLabel(summary.stage)}
                        {practices.length > 0 && (
                          <span style={{ marginLeft: "0.5rem", fontSize: "0.9em" }}>
                            {isExpanded ? "▼" : "▶"} ({practices.length}/5)
                          </span>
                        )}
                      </strong>
                      <span>{formatMoney(summary.expected)}</span>
                      <span>{formatMoney(summary.paid)}</span>
                      <span>{formatMoney(summary.balance)}</span>
                    </div>
                    {isExpanded && practices.length > 0 && (
                      <div style={{ padding: "0.75rem", backgroundColor: "#f8f8f8", borderLeft: "3px solid var(--invoice-phase-accent)" }}>
                        <h5 style={{ marginBottom: "0.5rem", color: "#333" }}>Type of Work Details:</h5>
                        <table style={{ width: "100%", fontSize: "0.85em", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ borderBottom: "1px solid #ddd", backgroundColor: "#f0f0f0" }}>
                              <th style={{ textAlign: "left", padding: "0.5rem", fontWeight: "600", color: "#555" }}>Type of Work</th>
                              <th style={{ textAlign: "right", padding: "0.5rem", fontWeight: "600", color: "#555" }}>Expected (RM)</th>
                              <th style={{ textAlign: "right", padding: "0.5rem", fontWeight: "600", color: "#555" }}>Paid (RM)</th>
                              <th style={{ textAlign: "right", padding: "0.5rem", fontWeight: "600", color: "#555" }}>Balance (RM)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {practices.map((item, idx) => {
                              const itemExpected = Number(item.selectedFee || 0);
                              const totalPhaseExpected = practices.reduce((sum, p) => sum + Number(p.selectedFee || 0), 0);
                              const itemPaidProportion = totalPhaseExpected > 0 ? (itemExpected / totalPhaseExpected) * summary.paid : 0;
                              const itemBalance = Math.max(itemExpected - itemPaidProportion, 0);
                              return (
                                <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                                  <td style={{ padding: "0.5rem", color: "#333" }}>
                                    <strong>{item.typeOfWork || "Work Item"}</strong>
                                    <br />
                                    <span style={{ fontSize: "0.8em", color: "#888" }}>
                                      {item.practiceArea || "-"}
                                    </span>
                                  </td>
                                  <td style={{ textAlign: "right", padding: "0.5rem", color: "#333" }}>
                                    {formatMoney(itemExpected)}
                                  </td>
                                  <td style={{ textAlign: "right", padding: "0.5rem", color: "#333" }}>
                                    {formatMoney(itemPaidProportion)}
                                  </td>
                                  <td style={{ textAlign: "right", padding: "0.5rem", color: itemBalance > 0 ? "#b91c1c" : "#16a34a", fontWeight: "600" }}>
                                    {formatMoney(itemBalance)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InvoicePhaseSummary;
