import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import AuthMemory from "../../../../data/authMemory";
import TemplateFields from "./TemplateFields";
import "../../../styles/documentGenerator.css";

const TemplateEditorCard = ({
  template,
  formData,
  caseInfoSummary,
  selectedLanguage,
  loading,
  error,
  onChange,
  onLanguageChange,
  onSubmit,
}) => {
  const location = useLocation();
  const currentSearch = location.search || "";
  const currentUserRole = String(AuthMemory.getUser()?.role || "").toLowerCase();
  const hideBiLanguage =
    currentUserRole === "admin" || currentUserRole === "junioradmin" || currentUserRole === "lawyer";
  const [showCaseInfo, setShowCaseInfo] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (template.id === "invoice") {
      setShowConfirmModal(true);
    } else {
      onSubmit(e);
    }
  };

  const handleConfirm = () => {
    setShowConfirmModal(false);
    onSubmit({ preventDefault: () => {} });
  };
  const hasCaseInfo =
    caseInfoSummary &&
    (caseInfoSummary.caseId ||
      caseInfoSummary.title ||
      caseInfoSummary.status ||
      caseInfoSummary.clientName ||
      caseInfoSummary.lawyerName ||
      caseInfoSummary.description);

  return (
    <div className="dg-page">
      <div className="dg-container" style={{ maxWidth: 900 }}>
        <Link to={`/document-generator${currentSearch}`} className="dg-link-back">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </Link>

        <div className="dg-shell">
          <div className="dg-shell-head">
            <div>
            <h1 className="text-2xl font-bold">{template.title}</h1>
            <p className="dg-shell-subtitle">{template.description}</p>
            </div>
          </div>

          {hasCaseInfo && (
              <div
                style={{
                  border: "1px solid #d9d9d9",
                  borderRadius: 10,
                  padding: "0.9rem 1rem",
                  background: "#fafafa",
                  margin: "0.75rem 0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                  <p className="dg-label" style={{ marginBottom: 0 }}>
                    Case Information (Read-only)
                  </p>
                  <button
                    type="button"
                    className="dg-btn"
                    onClick={() => setShowCaseInfo((prev) => !prev)}
                    style={{ padding: "0.35rem 0.65rem", fontSize: "0.85rem" }}
                  >
                    {showCaseInfo ? "Hide" : "Show"}
                  </button>
                </div>

                {showCaseInfo && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.4rem 0.9rem", marginTop: "0.5rem" }}>
                      <div><strong>Case ID:</strong> {caseInfoSummary.caseId || "-"}</div>
                      <div><strong>Title:</strong> {caseInfoSummary.title || "-"}</div>
                      <div><strong>Status:</strong> {caseInfoSummary.status || "-"}</div>
                      <div><strong>Client:</strong> {caseInfoSummary.clientName || "-"}</div>
                      <div><strong>Lawyer:</strong> {caseInfoSummary.lawyerName || "-"}</div>
                    </div>
                    {caseInfoSummary.description ? (
                      <div style={{ marginTop: "0.45rem" }}>
                        <strong>Case Summary:</strong> {caseInfoSummary.description}
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            )}

          <form onSubmit={handleFormSubmit} className="dg-body dg-stack">
            <div>
              <p className="dg-label">Document Language</p>
              <div className="dg-language">
                <button
                  type="button"
                  onClick={() => onLanguageChange("english")}
                  className={selectedLanguage === "english" ? "dg-active" : ""}
                >
                  English
                </button>
                {!hideBiLanguage && (
                  <button
                    type="button"
                    onClick={() => onLanguageChange("bi")}
                    className={selectedLanguage === "bi" ? "dg-active" : ""}
                  >
                    BI (English)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onLanguageChange("malay")}
                  className={selectedLanguage === "malay" ? "dg-active" : ""}
                >
                  Malay
                </button>
              </div>
            </div>

            <TemplateFields
              fields={template.fields}
              formData={formData}
              onChange={onChange}
            />

            {error && <div className="dg-alert-error">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="dg-btn dg-btn-primary"
              style={{ width: "100%" }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate"
              )}
            </button>
          </form>
        {showConfirmModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: "2rem",
                maxWidth: 420,
                width: "90%",
                boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: "0.75rem", fontSize: "1.1rem", fontWeight: 700 }}>
                Confirm Invoice Generation
              </h3>
              <p style={{ marginBottom: "1.25rem", color: "#444", lineHeight: 1.6 }}>
                Please verify all invoice details are correct before generating. This will create an invoice record for the selected case and payment stage.
              </p>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="dg-btn"
                  onClick={() => setShowConfirmModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="dg-btn dg-btn-primary"
                  onClick={handleConfirm}
                >
                  Confirm &amp; Generate
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default TemplateEditorCard;
