import React from "react";
import { useLocation } from "react-router-dom";
import NavBarClient from "../../../../shared/Navbar/NavBar Client/new";
import CaseProgress from "./components/CaseProgress";
import FileSection from "./components/Pagination";
import { useCallback, useEffect, useState } from "react";
import AuthMemory from "../../../../data/authMemory";
import { fetchClientFullData } from "../../../../hooks/clientApi";
import { Case, ClientFullData } from "../../../../data/userInfo";
import axiosUser from "../../../../api/axiosUser";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Alert from "react-bootstrap/Alert";
import { formatCaseDate } from "../../../../utils/caseDates";
import LoadingSpinner from "../../../../components/ui/Spinner";
import "../../../Admin/Pages/Billing/billing.css";
import "./viewCase.css";

const ViewCase: React.FC = () => {
  const location = useLocation();
  const { selectedCaseId: initialSelectedCaseId, activeFileSection: requestedActiveFileSection } =
    (location.state || {}) as {
      selectedCaseId?: number | null;
      activeFileSection?: "recent" | "pending" | "documents" | "reports" | "invoices";
    };

  const [data, setData] = useState<ClientFullData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [activeFileSection, setActiveFileSection] = useState<"recent" | "pending" | "documents" | "reports" | "invoices">(
    requestedActiveFileSection || "recent"
  );
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadMessageVariant, setUploadMessageVariant] = useState<"success" | "danger">("success");

  const refreshClientData = useCallback(async () => {
    const firmID = AuthMemory.getUser()?.firmID;
    if (!firmID) {
      return;
    }

    const res = await fetchClientFullData(firmID);
    setData(res);

    if (res.cases?.length) {
      const currentSelectedCaseId = Number(selectedCase?.caseId);
      const targetCase =
        Number.isFinite(currentSelectedCaseId) && currentSelectedCaseId > 0
          ? res.cases.find((item) => Number(item.caseId) === currentSelectedCaseId) || res.cases[0]
          : Number.isFinite(Number(initialSelectedCaseId)) && Number(initialSelectedCaseId) > 0
            ? res.cases.find((item) => Number(item.caseId) === Number(initialSelectedCaseId)) || res.cases[0]
          : res.cases[0];

      setSelectedCase(targetCase);
    }
  }, [initialSelectedCaseId, selectedCase?.caseId]);

  useEffect(() => {
    const firmID = AuthMemory.getUser()?.firmID;

    if (!firmID) {
      setLoading(false);
      return;
    }

    fetchClientFullData(firmID)
      .then((res) => {
        setData(res);
        if (res.cases?.length) {
          const targetCase =
            Number.isFinite(Number(initialSelectedCaseId)) && Number(initialSelectedCaseId) > 0
              ? res.cases.find((item) => Number(item.caseId) === Number(initialSelectedCaseId)) || res.cases[0]
              : res.cases[0];

          setSelectedCase(targetCase);
        }
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [initialSelectedCaseId]);

  useEffect(() => {
    if (
      requestedActiveFileSection === "recent" ||
      requestedActiveFileSection === "pending" ||
      requestedActiveFileSection === "documents" ||
      requestedActiveFileSection === "reports" ||
      requestedActiveFileSection === "invoices"
    ) {
      setActiveFileSection(requestedActiveFileSection);
    }
  }, [requestedActiveFileSection]);

  const handleClientUpload = async () => {
    if (!selectedCase || !uploadFile) {
      return;
    }

    const currentUser = AuthMemory.getUser();
    const token = AuthMemory.getToken();

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("case_id", String(selectedCase.caseId));
    formData.append("category", "documents");

    setUploadingDocument(true);

    try {
      await axiosUser.post(`${process.env.REACT_APP_API_URL}/encrypted-documents/upload`, formData, {
        headers: {
          Accept: "application/json",
          "X-User-Role": currentUser?.role || "",
          "X-User-FirmID": currentUser?.firmID || "",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      setUploadMessage("Document submitted for review. A Lawyer or Admin will approve it before it is stored securely.");
      setUploadMessageVariant("success");
      setUploadFile(null);
      await refreshClientData();
    } catch (error: any) {
      setUploadMessage(error?.response?.data?.message || error?.message || "Failed to upload document.");
      setUploadMessageVariant("danger");
    } finally {
      setUploadingDocument(false);
    }
  };

  if (loading) {
    return (
      <>
        <NavBarClient />
        <div className="client-view-case-state">Loading case data...</div>
      </>
    );
  }

  if (!data || data.cases.length === 0) {
    return (
      <>
        <NavBarClient />
        <div className="client-view-case-state">No case available.</div>
      </>
    );
  }

  const encryptedDocs = Array.isArray((selectedCase as any)?.encrypted_documents)
    ? (selectedCase as any).encrypted_documents
    : [];

  const quickAccessItems = [
    { label: "Recent", hint: "All encrypted", section: "recent" as const, count: encryptedDocs.filter((doc: any) => doc?.status !== "deleted").length },
    { label: "Pending", hint: "Awaiting review", section: "pending" as const, count: encryptedDocs.filter((doc: any) => String(doc?.status || "").toLowerCase() === "pending_approval").length },
    { label: "Documents", hint: "Case files", section: "documents" as const, count: encryptedDocs.filter((doc: any) => doc?.category === "documents" && doc?.status !== "deleted").length },
    { label: "Reports", hint: "Generated", section: "reports" as const, count: encryptedDocs.filter((doc: any) => doc?.category === "reports" && doc?.status !== "deleted").length },
    { label: "Invoices", hint: "Payment docs", section: "invoices" as const, count: encryptedDocs.filter((doc: any) => doc?.category === "invoices" && doc?.status !== "deleted").length },
  ];

  const caseDescription =
    (selectedCase as any)?.description ||
    (selectedCase as any)?.caseDescription ||
    "No case description available.";

  const parseDateMillis = (value: unknown): number => {
    if (!value) return 0;
    const dateMillis = new Date(String(value)).getTime();
    return Number.isFinite(dateMillis) ? dateMillis : 0;
  };

  const caseCreatedAt = formatCaseDate((selectedCase as any)?.created_at || (selectedCase as any)?.createdAt);
  const caseModifiedSource =
    (selectedCase as any)?.updated_at ||
    (selectedCase as any)?.modified_at ||
    (selectedCase as any)?.updatedAt;
  const caseModifiedMillis = parseDateMillis(caseModifiedSource);
  const latestDocumentMillis = encryptedDocs.reduce((latest: number, doc: any) => {
    const docMillis = parseDateMillis(doc?.updated_at || doc?.created_at || doc?.createdAt);
    return Math.max(latest, docMillis);
  }, 0);
  const effectiveModifiedMillis = Math.max(caseModifiedMillis, latestDocumentMillis);
  const caseModifiedAt =
    effectiveModifiedMillis > 0
      ? formatCaseDate(new Date(effectiveModifiedMillis).toISOString())
      : formatCaseDate(caseModifiedSource);
  const caseStatusLabel = String(
    (selectedCase as any)?.status || (selectedCase as any)?.caseStatus || "Unknown"
  ).trim() || "Unknown";
  const normalizedCaseStatus = caseStatusLabel.toLowerCase();

  return (
    <>
      {/* Navbar */}
      <NavBarClient />

      {uploadMessage && (
        <div className="admin-billing-alert-wrap">
          <Alert variant={uploadMessageVariant} dismissible onClose={() => setUploadMessage(null)}>
            {uploadMessage}
          </Alert>
        </div>
      )}

      <div className="admin-billing-page client-view-case-page">
        <div className="admin-billing-header">
          <CaseProgress
            cases={data.cases}
            selectedCase={selectedCase}
            onSelectCase={setSelectedCase}
          />
        </div>

        <div className="admin-billing-main-grid client-view-case-main-grid">
          <aside className="admin-billing-side-panel admin-billing-card">
            <div className="admin-billing-toolbar-label">Quick Access</div>
            <div className="admin-billing-quick-grid">
              {quickAccessItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={`admin-billing-quick-item-btn ${activeFileSection === item.section ? "active" : ""}`}
                  onClick={() => setActiveFileSection(item.section)}
                >
                  <div className="admin-billing-quick-item-main">
                    <span>{item.label}</span>
                    <small>{item.hint}</small>
                  </div>
                  <strong>{item.count}</strong>
                </button>
              ))}
            </div>
          </aside>

          <div className="admin-billing-content-col">
            <div className="admin-billing-top-row admin-billing-card">
              <div className="admin-billing-card-header-row">
                <div>
                  <h2>Case Description</h2>
                  <p>{caseDescription}</p>
                  <div className="admin-billing-meta-row" style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                    <span><strong>Date Created:</strong> {caseCreatedAt}</span>
                    <span><strong>Date Modified:</strong> {caseModifiedAt}</span>
                  </div>
                  <div className="client-view-case-status-row">
                    <span className="client-view-case-status-label">Status</span>
                    <span className={`client-view-case-status-badge client-view-case-status-${normalizedCaseStatus}`}>
                      {caseStatusLabel}
                    </span>
                  </div>

                  <div className="client-view-case-upload-wrap">
                    <div className="client-view-case-upload-panel">
                      <div className="client-view-case-upload-note">
                        Uploaded documents will be reviewed by a Lawyer or Admin before being stored securely.
                      </div>
                      <Form.Control
                        type="file"
                        accept="application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        disabled={!selectedCase || uploadingDocument || normalizedCaseStatus === "archived"}
                        onChange={(event) => {
                          const input = event.currentTarget as HTMLInputElement;
                          const file = input.files?.[0] || null;
                          setUploadFile(file);
                          input.value = "";
                        }}
                      />
                      {uploadFile && (
                        <div className="client-view-case-upload-file-name">
                          Selected file: {uploadFile.name}
                        </div>
                      )}
                      <Button
                        variant="primary"
                        onClick={() => void handleClientUpload()}
                        disabled={!uploadFile || uploadingDocument || !selectedCase || normalizedCaseStatus === "archived"}
                      >
                        {uploadingDocument ? (
                          <>
                            <LoadingSpinner size={16} color="#ffffff" />
                            Uploading...
                          </>
                        ) : (
                          "Upload Document"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Documents / Reports / Invoices Section */}
            {selectedCase && (
              <div className="admin-billing-files-wrap admin-billing-card">
                <FileSection
                  selectedCase={selectedCase}
                  activeKey={activeFileSection}
                  onActiveKeyChange={setActiveFileSection}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewCase;