export const DOCUMENT_PLACEHOLDER_OPTIONS = [
  { value: "identification", label: "Identification" },
  { value: "evidence", label: "Evidence" },
  { value: "supporting_document", label: "Supporting Document" },
  { value: "contract", label: "Contract" },
  { value: "correspondence", label: "Correspondence" },
  { value: "court_order", label: "Court Order" },
  { value: "invoice_receipt", label: "Invoice / Receipt" },
  { value: "medical_record", label: "Medical Record" },
  { value: "financial_record", label: "Financial Record" },
  { value: "other", label: "Other" },
];

export const DEFAULT_DOCUMENT_PLACEHOLDER = "identification";

export const getDocumentPlaceholderLabel = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  const matched = DOCUMENT_PLACEHOLDER_OPTIONS.find((option) => option.value === normalized);
  return matched?.label || "Other";
};
