import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import NavBarClient from "../../../../shared/Navbar/NavBar Client/new";
import CaseProgress from "./components/CaseProgress";
import FileSection from "./components/Pagination";
import AuthMemory from "../../../../data/authMemory";
import { fetchClientFullData } from "../../../../hooks/clientApi";
import { Case, ClientFullData } from "../../../../data/userInfo";
import axiosUser from "../../../../api/axiosUser";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import { formatCaseDate } from "../../../../utils/caseDates";
import LoadingSpinner from "../../../../components/ui/Spinner";
import { subscribeToWebPubSubNotifications } from "../../../../lib/webPubSubNotifications";
import { getEcho } from "../../../../lib/echo";
import { resolveRealtimeDriver } from "../../../../lib/realtimeDriver";
import "../../../Admin/Pages/Billing/billing.css";
import "./viewCase.css";

const REALTIME_DRIVER = resolveRealtimeDriver();

const extractRealtimeCaseId = (payload: unknown): number | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidate = payload as Record<string, unknown>;
  const nested = candidate.data && typeof candidate.data === "object" ? (candidate.data as Record<string, unknown>) : null;
  const source = nested ?? candidate;

  const explicitCaseId = Number(source.case_id);
  if (Number.isFinite(explicitCaseId) && explicitCaseId > 0) {
    return explicitCaseId;
  }

  const message = typeof source.message === "string" ? source.message : "";
  const match = message.match(/Case\s*#(\d+)/i);
  if (!match) {
    return null;
  }

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const isDocumentRealtimeEvent = (payload: unknown): boolean => {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as Record<string, unknown>;
  const nested = candidate.data && typeof candidate.data === "object" ? (candidate.data as Record<string, unknown>) : null;
  const source = nested ?? candidate;

  const title = String(source.title || source.event || "").toLowerCase();
  const message = String(source.message || "").toLowerCase();

  return (
    title.includes("document") ||
    title.includes("invoice") ||
    message.includes("document") ||
    message.includes("invoice")
  );
};

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
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadMessageVariant, setUploadMessageVariant] = useState<"success" | "danger">("success");
  const uploadInputRef = React.useRef<HTMLInputElement | null>(null);
  const lastRealtimeRefreshRef = useRef<{ key: string; at: number } | null>(null);

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

  useEffect(() => {
    const userId = AuthMemory.getUser()?.id;
    if (!userId || !selectedCase?.caseId) {
      return;
    }

    const handleRealtimePayload = (payload: unknown) => {
      if (!isDocumentRealtimeEvent(payload)) {
        return;
      }

      const payloadCaseId = extractRealtimeCaseId(payload);
      if (!payloadCaseId || Number(payloadCaseId) !== Number(selectedCase.caseId)) {
        return;
      }

      const now = Date.now();
      const refreshKey = `${payloadCaseId}`;
      const previous = lastRealtimeRefreshRef.current;
      if (previous && previous.key === refreshKey && now - previous.at < 4000) {
        return;
      }

      lastRealtimeRefreshRef.current = { key: refreshKey, at: now };
      void refreshClientData();
    };

    if (REALTIME_DRIVER === "webpubsub") {
      const dispose = subscribeToWebPubSubNotifications(
        (payload) => {
          handleRealtimePayload(payload);
        },
        (err) => {
        }
      );

      return () => {
        dispose();
      };
    }

    try {
      getEcho()
        .private(`App.Models.User.${userId}`)
        .listen(".UserNotificationCreated", (payload: unknown) => {
          handleRealtimePayload(payload);
        });
    } catch (err) {
    }

    return () => {
      try {
        getEcho().leave(`App.Models.User.${userId}`);
      } catch {
        // ignore cleanup errors
      }
    };
  }, [refreshClientData, selectedCase?.caseId]);

  const handleClientUpload = async (file: File) => {
    if (!selectedCase) {
      return;
    }

    const currentUser = AuthMemory.getUser();
    const token = AuthMemory.getToken();

    const formData = new FormData();
    formData.append("file", file);
    formData.append("case_id", String(selectedCase.caseId));
    formData.append("category", "documents");

    setUploadingDocument(true);

    try {
      await axiosUser.post(`/encrypted-documents/upload`, formData, {
        headers: {
          Accept: "application/json",
          "X-User-Role": currentUser?.role || "",
          "X-User-FirmID": currentUser?.firmID || "",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      setUploadMessage("Document submitted for review. A Lawyer or Admin will approve it before it is stored securely.");
      setUploadMessageVariant("success");
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
                      <input
                        ref={uploadInputRef}
                        type="file"
                        style={{ display: "none" }}
                        accept="application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        disabled={!selectedCase || uploadingDocument || normalizedCaseStatus === "archived"}
                        onChange={(event) => {
                          const input = event.currentTarget as HTMLInputElement;
                          const file = input.files?.[0];
                          if (file) {
                            void handleClientUpload(file);
                          }
                          input.value = "";
                        }}
                      />
                      <Button
                        variant="primary"
                        onClick={() => uploadInputRef.current?.click()}
                        disabled={uploadingDocument || !selectedCase || normalizedCaseStatus === "archived"}
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
                  onUploadSuccess={refreshClientData}
                  onDeleteSuccess={refreshClientData}
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
