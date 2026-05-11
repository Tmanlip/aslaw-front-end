import React from "react";
import Form from "react-bootstrap/Form";
import "./expectedPaymentsPagination.css";

interface PaymentPhase {
  label: string;
  key: string;
  value: string;
}

interface ExpectedPaymentsPaginationProps {
  mode?: "edit" | "view";
  formData?: {
    expectedInitialPayment: string;
    expectedFirstPayment: string;
    expectedSecondPayment: string;
    expectedThirdPayment: string;
    expectedFinalPayment: string;
  };
  payments?: {
    initial?: unknown;
    first?: unknown;
    second?: unknown;
    third?: unknown;
    final?: unknown;
  };
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ExpectedPaymentsPagination: React.FC<ExpectedPaymentsPaginationProps> = ({
  mode = "edit",
  formData,
  payments,
  onChange,
}) => {
  const formatMoney = (value: unknown): string => {
    const numericValue = Number(value || 0);
    return Number.isFinite(numericValue) ? numericValue.toFixed(2) : "0.00";
  };

  const phases: PaymentPhase[] = [
    {
      label: "Initial",
      key: "expectedInitialPayment",
      value: mode === "view" ? formatMoney(payments?.initial) : formData?.expectedInitialPayment || "0",
    },
    {
      label: "First",
      key: "expectedFirstPayment",
      value: mode === "view" ? formatMoney(payments?.first) : formData?.expectedFirstPayment || "0",
    },
    {
      label: "Second",
      key: "expectedSecondPayment",
      value: mode === "view" ? formatMoney(payments?.second) : formData?.expectedSecondPayment || "0",
    },
    {
      label: "Third",
      key: "expectedThirdPayment",
      value: mode === "view" ? formatMoney(payments?.third) : formData?.expectedThirdPayment || "0",
    },
    {
      label: "Final",
      key: "expectedFinalPayment",
      value: mode === "view" ? formatMoney(payments?.final) : formData?.expectedFinalPayment || "0",
    },
  ];

  return (
    <div className="expected-payments-pagination">
      <div className="expected-payments-pagination-phases">
        {phases.map((phase, index) => (
          <div key={phase.key} className="expected-payments-phase-item">
            <div className="expected-payments-phase-badge">{index + 1}</div>
            <div className="expected-payments-phase-content">
              <label className="expected-payments-phase-label">{phase.label}</label>
              {mode === "view" ? (
                <div className="expected-payments-phase-value">RM {phase.value}</div>
              ) : (
                <Form.Control
                  type="number"
                  min="0"
                  step="0.01"
                  name={phase.key}
                  value={phase.value}
                  onChange={onChange}
                  placeholder="0.00"
                  className="expected-payments-phase-input"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExpectedPaymentsPagination;
