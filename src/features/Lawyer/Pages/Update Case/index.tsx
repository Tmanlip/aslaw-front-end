import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { useLocation } from "react-router-dom";
import NavBarLawyer from "../../../../shared/Navbar/NavBar Lawyer/new";
import AuthMemory from "../../../../data/authMemory";
import { fetchClientFullData } from "../../../../hooks/clientApi";
import { fetchLawyerFullData, invalidateLawyerCache } from "../../../../hooks/lawyerApi";
import CaseProgress from "./components/CaseProgress";
import FileSection from "./components/Tabs";
import { Case, LawyerFullData } from "../../../../data/userInfo";
import axiosUser from "../../../../api/axiosUser";
import { formatCaseDate } from "../../../../utils/caseDates";
import { getEcho } from "../../../../lib/echo";
import { subscribeToWebPubSubNotifications } from "../../../../lib/webPubSubNotifications";
import { resolveRealtimeDriver } from "../../../../lib/realtimeDriver";
import "../../../Admin/Pages/Billing/billing.css";
import "./updateCase.css";

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

const splitAddress = (value: string) => {
  const lines = String(value || "")
    .split(/\r?\n|,/) 
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    line1: lines[0] || "",
    line2: lines.slice(1).join(", ") || "",
  };
};

const UpdateCase: React.FC = () => {
  const location = useLocation();
  const { selectedCaseId: initialSelectedCaseId, activeFileSection: requestedActiveFileSection } =
    (location.state || {}) as {
      selectedCaseId?: number | null;
      activeFileSection?: "recent" | "pending" | "documents" | "reports" | "invoices";
    };

  const [data, setData] = useState<LawyerFullData | null>(null);
  const [clientData, setClientData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isDocGeneratorOpen, setIsDocGeneratorOpen] = useState(false);
  const [docGeneratorCategory, setDocGeneratorCategory] = useState<string | undefined>(undefined);
  const [isEditCaseOpen, setIsEditCaseOpen] = useState(false);
  const [savingCase, setSavingCase] = useState(false);
  const [caseForm, setCaseForm] = useState({ title: "", description: "" });
  const [activeFileSection, setActiveFileSection] = useState<"recent" | "pending" | "documents" | "reports" | "invoices">(
    requestedActiveFileSection || "recent"
  );
  const isRefreshingCaseRef = useRef(false);
  const lastProgressEventRef = useRef<{ key: string; at: number } | null>(null);
  const lastUploadEventRef = useRef<{ key: string; at: number } | null>(null);
  const lastRealtimeRefreshRef = useRef<{ key: string; at: number } | null>(null);

  const documentGeneratorUrl = `${window.location.origin}/document-generator`;

  const documentGeneratorSrc = useMemo(() => {
    if (!selectedCase) return documentGeneratorUrl;

    const authToken = AuthMemory.getToken?.() || "";
    const returnTo = `${window.location.origin}${window.location.pathname}${window.location.search}`;
    const lawyer = data?.lawyer || AuthMemory.getUser() || {};
    const client = clientData?.client || {};
    const clientAddress = splitAddress(client.HomeAddress || selectedCase.clientName || "");
    const lawyerAddress = splitAddress(lawyer.HomeAddress || "");
    const today = new Date().toISOString().slice(0, 10);
    const caseRef = selectedCase.title || selectedCase.caseName || `Case #${selectedCase.caseId}`;
    const caseSummary = selectedCase.description || selectedCase.title || "";

    const prefill = {
      // Shared/common
      Date: today,
      date: today,
      Reference: caseRef,
      Currency: "RM",
      GoodsOrServices: caseSummary,

      // Lawyer/client/case data
      YourCompanyName: lawyer.name || "",
      YourSignerName: lawyer.name || "",
      YourSignerTitle: "Lawyer",
      ContactPhone: lawyer.phoneNumber || "",
      ContactEmail: lawyer.email || "",
      RecipientName: client.name || selectedCase.clientName || "",
      RecipientCompanyName: client.firmID || selectedCase.clientName || "",
      RecipientAddressLine1: clientAddress.line1,
      RecipientAddressLine2: clientAddress.line2,
      ClientName: client.name || selectedCase.clientName || "",
      ClientServiceAddress: clientAddress.line1 || lawyerAddress.line1,
      BackgroundFacts: caseSummary,
      PaymentWindowDays: "5",
      AmountDue: "",
      MainSocialAccount: "",
      PaymentInstructions: "",
      RemittanceEmail: lawyer.email || "",

      // Official Email / generic templates
      recipientName: client.name || selectedCase.clientName || "",
      companyName: client.firmID || "",
      subject: `Regarding ${caseRef}`,
      message: caseSummary,
      senderName: lawyer.name || "",
      senderTitle: "Lawyer",

      // Leave templates
      managerName: lawyer.name || "",
      startDate: today,
      endDate: today,
      reason: caseSummary,
      mcDate: today,
      diagnosis: "",

      // Meeting minutes / project update / report
      meetingTitle: caseRef,
      attendees: [lawyer.name, client.name].filter(Boolean).join(", "),
      agenda: caseSummary,
      decisions: "",
      actionItems: "",
      projectName: caseRef,
      progress: caseSummary,
      nextSteps: "",
      reportTitle: caseRef,
      preparedBy: lawyer.name || "",
      objective: caseSummary,
      findings: "",
      recommendations: "",
      conclusion: "",

      // Writ of Summons
      CourtName: "",
      CourtLocation: "",
      CaseNumber: String(selectedCase.caseId || ""),
      PlaintiffName: client.name || selectedCase.clientName || "",
      PlaintiffNRIC: client.ICNumber || "",
      PlaintiffAddressLine1: clientAddress.line1,
      PlaintiffAddressLine2: clientAddress.line2,
      DefendantName: "",
      DefendantNRIC: "",
      DefendantAddressLine1: "",
      DefendantAddressLine2: "",
      ClaimAmount: "",
      ClaimDescription: caseSummary,
      ContractDate: today,
      BreachDetails: caseSummary,
      InterestRate: "",
      CostsAmount: "",
      AppearanceDays: "14",
      HearingDate: today,
      LawFirmName: lawyer.name || "",
      LawFirmAddress: [lawyerAddress.line1, lawyerAddress.line2].filter(Boolean).join(", "),
      LawyerName: lawyer.name || "",
      LawyerPhone: lawyer.phoneNumber || "",
      LawyerEmail: lawyer.email || "",
      CourtSealReference: caseRef,

      // Invoice generator
      invoice_id: "",
      invoice_number: "",
      lawyerID: selectedCase.lawyerId || "",
      clientID: selectedCase.clientId || "",
      case_id: String(selectedCase.caseId || ""),
      payment_stage: "initial",
      issue_date: today,
      due_date: today,
      expected_amount: "",
      paid_amount: "",
      balance: "",
      tax: "0",
      discount: "0",
      total_amount: "",
      client_name: client.name || selectedCase.clientName || "",
      case_title: selectedCase.title || "",
      blob_path: "",
      case_type_fee_json: selectedCase.case_type_fee_json || null,
      expected_payment_phases: selectedCase.expected_payment_phases || null,
      invoice_payment_phases: selectedCase.invoice_payment_phases || null,
      case_data: {
        caseId: selectedCase.caseId,
        case_id: selectedCase.caseId,
        title: selectedCase.title || "",
        description: selectedCase.description || selectedCase.title || "",
        status: selectedCase.status || "",
        blob_folder_path: selectedCase.blob_folder_path || "",
        clientId: selectedCase.clientId,
        clientFirmID: selectedCase.clientFirmID,
        lawyerId: selectedCase.lawyerId,
        lawyerFirmID: selectedCase.lawyerFirmID,
        clientName: client.name || selectedCase.clientName || "",
        lawyerName: lawyer.name || selectedCase.lawyerName || "",
        case_type_fee_json: selectedCase.case_type_fee_json || null,
        expected_payment_phases: selectedCase.expected_payment_phases || null,
        invoice_payment_phases: selectedCase.invoice_payment_phases || null,
      },
    };

    const params = new URLSearchParams({
      source: "aslaw-front-end",
      caseId: String(selectedCase.caseId),
      case_id: String(selectedCase.caseId),
      caseTitle: selectedCase.title || "",
      case_status: selectedCase.status || "",
      blob_folder_path: selectedCase.blob_folder_path || "",
      access_token: authToken,
      return_to: returnTo,
      prefill: JSON.stringify(prefill),
    });

    const separator = documentGeneratorUrl.includes("?") ? "&" : "?";
    return `${documentGeneratorUrl}${separator}${params.toString()}`;
  }, [documentGeneratorUrl, selectedCase, data, clientData]);

  useEffect(() => {
    const firmID = AuthMemory.getUser()?.firmID;

    if (firmID) {
      // Always fetch the latest snapshot when opening Update Case.
      invalidateLawyerCache(firmID);
      fetchLawyerFullData(firmID)
        .then((res) => {
          setData(res);
          AuthMemory.setLawyerFullData?.(res);

          if (res.cases?.length) {
            const targetCase =
              Number.isFinite(Number(initialSelectedCaseId)) && Number(initialSelectedCaseId) > 0
                ? res.cases.find((item) => Number(item.caseId) === Number(initialSelectedCaseId)) || res.cases[0]
                : res.cases[0];

            setSelectedCase(targetCase);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
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
    const clientFirmID = selectedCase?.clientFirmID;
    if (!clientFirmID) {
      setClientData(null);
      return;
    }

    fetchClientFullData(clientFirmID)
      .then((res) => setClientData(res))
      .catch((err) => console.error("Failed to load client data for document generator:", err));
  }, [selectedCase?.clientFirmID]);

  useEffect(() => {
    setCaseForm({
      title: selectedCase?.title || "",
      description: selectedCase?.description || "",
    });
  }, [selectedCase]);

  const refreshCaseData = useCallback(async () => {
    if (isRefreshingCaseRef.current) {
      return;
    }

    const firmID = AuthMemory.getUser()?.firmID;
    if (firmID) {
      try {
        isRefreshingCaseRef.current = true;
        invalidateLawyerCache(firmID);
        const freshData = await fetchLawyerFullData(firmID);
        setData(freshData);
        AuthMemory.setLawyerFullData?.(freshData);

        if (selectedCase && freshData.cases?.length) {
          const updatedCase = freshData.cases.find(
            (c) => Number(c.caseId) === Number(selectedCase.caseId)
          );
          if (updatedCase) {
            setSelectedCase(updatedCase);
          }
        }
      } catch (err) {
        console.error("Failed to refresh case data after file change:", err);
      } finally {
        isRefreshingCaseRef.current = false;
      }
    }
  }, [selectedCase]);

  // Callback to refresh case data after file upload/delete or case edit
  const handleCaseChangeSuccess = useCallback(async () => {
    await refreshCaseData();
  }, [refreshCaseData]);

  const handleCaseEditSave = async () => {
    if (!selectedCase) {
      return;
    }

    setSavingCase(true);

    try {
      const currentUser = AuthMemory.getUser();

      await axiosUser.put(
        `/cases/${selectedCase.caseId}`,
        {
          title: caseForm.title.trim(),
          description: caseForm.description.trim(),
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-User-Role": currentUser?.role || "",
            "X-User-FirmID": currentUser?.firmID || "",
          },
        }
      );

      await refreshCaseData();
      setIsEditCaseOpen(false);
    } catch (error: any) {
      console.error("Failed to update case info:", error.response?.data || error.message);
      alert(error?.response?.data?.message || "Failed to update case information.");
    } finally {
      setSavingCase(false);
    }
  };

  // Debug log for cases
  useEffect(() => {
    if (data) {
      console.log("RAW DATA FROM API:", JSON.stringify(data, null, 2));
    }
  }, [data]);

  useEffect(() => {
    if (!isDocGeneratorOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDocGeneratorOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isDocGeneratorOpen]);

  useEffect(() => {
    if (!isDocGeneratorOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isDocGeneratorOpen]);

  useEffect(() => {
    const handleGeneratorMessage = (event: MessageEvent) => {
      const payload = event.data;
      if (!payload) return;

      if (payload.type === "ASLAW_CASE_PROGRESS_UPDATED") {
        const targetCaseId = Number(payload.case_id || 0);
        const nextProgress = Number(payload.case_progress);

        if (Number.isFinite(targetCaseId) && targetCaseId > 0 && Number.isFinite(nextProgress)) {
          const progressKey = `${targetCaseId}:${nextProgress}`;
          const now = Date.now();
          const previousProgressEvent = lastProgressEventRef.current;

          if (
            previousProgressEvent &&
            previousProgressEvent.key === progressKey &&
            now - previousProgressEvent.at < 3000
          ) {
            return;
          }

          lastProgressEventRef.current = { key: progressKey, at: now };

          setSelectedCase((prev) => {
            if (!prev || Number(prev.caseId) !== targetCaseId) return prev;
            return { ...prev, progress: nextProgress };
          });

          setData((prev) => {
            if (!prev?.cases) return prev;
            return {
              ...prev,
              cases: prev.cases.map((item) =>
                Number(item.caseId) === targetCaseId ? { ...item, progress: nextProgress } : item
              ),
            };
          });
        }

        return;
      }

      if (payload.type !== "ASLAW_DOCUMENT_UPLOADED") return;

      const uploadCaseId = Number(payload.case_id || 0);
      const uploadKey = `${uploadCaseId}:${String(payload.category || "")}:${String(payload.case_progress ?? "")}`;
      const now = Date.now();
      const previousUploadEvent = lastUploadEventRef.current;

      if (
        previousUploadEvent &&
        previousUploadEvent.key === uploadKey &&
        now - previousUploadEvent.at < 6000
      ) {
        return;
      }

      lastUploadEventRef.current = { key: uploadKey, at: now };

      setIsDocGeneratorOpen(false);

      // Keep the user on the same page and refresh data in-place.
      void handleCaseChangeSuccess();

      // If generator already has the latest progress, apply it immediately.
      const targetCaseId = Number(payload.case_id || 0);
      const nextProgress = Number(payload.case_progress);
      if (Number.isFinite(targetCaseId) && targetCaseId > 0 && Number.isFinite(nextProgress)) {
        setSelectedCase((prev) => {
          if (!prev || Number(prev.caseId) !== targetCaseId) return prev;
          return { ...prev, progress: nextProgress };
        });

        setData((prev) => {
          if (!prev?.cases) return prev;
          return {
            ...prev,
            cases: prev.cases.map((item) =>
              Number(item.caseId) === targetCaseId ? { ...item, progress: nextProgress } : item
            ),
          };
        });
      }
    };

    window.addEventListener("message", handleGeneratorMessage);
    return () => window.removeEventListener("message", handleGeneratorMessage);
  }, [handleCaseChangeSuccess]);

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
      void handleCaseChangeSuccess();
    };

    if (REALTIME_DRIVER === "webpubsub") {
      const dispose = subscribeToWebPubSubNotifications(
        (payload) => {
          handleRealtimePayload(payload);
        },
        (err) => {
          console.warn("Azure Web PubSub case sync issue", err);
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
      console.warn("Realtime case sync subscription failed", err);
    }

    return () => {
      try {
        getEcho().leave(`App.Models.User.${userId}`);
      } catch {
        // ignore cleanup errors
      }
    };
  }, [handleCaseChangeSuccess, selectedCase?.caseId]);

  if (loading) {
    return (
      <>
        <NavBarLawyer />
        <div className="lawyer-update-case-state">Loading case data...</div>
      </>
    );
  }

  if (!data || data.cases.length === 0) {
    return (
      <>
        <NavBarLawyer />
        <div className="lawyer-update-case-state">No case available.</div>
      </>
    );
  }

  const encryptedDocs = Array.isArray((selectedCase as any)?.encrypted_documents)
    ? (selectedCase as any).encrypted_documents
    : [];
  const activeEncryptedCount = encryptedDocs.filter((doc: any) => doc?.status !== "deleted").length;
  const encryptedInvoiceCount = encryptedDocs.filter((doc: any) => doc?.category === "invoices" && doc?.status !== "deleted").length;

  const quickAccessItems = [
    { label: "Recent", hint: "All encrypted", section: "recent" as const, count: activeEncryptedCount },
    { label: "Pending", hint: "Awaiting review", section: "pending" as const, count: encryptedDocs.filter((doc: any) => String(doc?.status || "").toLowerCase() === "pending_approval").length },
    { label: "Documents", hint: "Case files", section: "documents" as const, count: encryptedDocs.filter((doc: any) => doc?.category === "documents" && doc?.status !== "deleted").length },
    { label: "Reports", hint: "Generated", section: "reports" as const, count: encryptedDocs.filter((doc: any) => doc?.category === "reports" && doc?.status !== "deleted").length },
    { label: "Invoices", hint: "Payment docs", section: "invoices" as const, count: encryptedInvoiceCount },
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
      <NavBarLawyer />

      <div className="admin-billing-page lawyer-update-case-page">
        <div className="admin-billing-header">
          <CaseProgress
            cases={data.cases}
            selectedCase={selectedCase}
            onSelectCase={setSelectedCase}
          />
        </div>

        <div className="admin-billing-main-grid lawyer-update-case-main-grid">
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
                  <div className="admin-billing-status-row">
                    <span className="admin-billing-status-label">Status</span>
                    <span
                      className={`admin-billing-status-badge admin-billing-status-${normalizedCaseStatus}`}
                    >
                      {caseStatusLabel}
                    </span>
                  </div>
                </div>

                <div className="admin-billing-action-col">
                  <Button
                    variant="secondary"
                    className="admin-billing-action-btn"
                    onClick={() => setIsEditCaseOpen(true)}
                    disabled={!selectedCase || (selectedCase?.status || "").toLowerCase() === "archived"}
                    title={
                      (selectedCase?.status || "").toLowerCase() === "archived"
                        ? "This case is archived. Case information editing is locked."
                        : "Edit case title and description"
                    }
                  >
                    Edit Case Info
                  </Button>
                </div>
              </div>
            </div>

            {/* Documents / Reports / Invoices */}
            {selectedCase && (
              <div className="admin-billing-files-wrap admin-billing-card">
                <FileSection
                  selectedCase={selectedCase}
                  onUploadSuccess={handleCaseChangeSuccess}
                  onDeleteSuccess={handleCaseChangeSuccess}
                  activeKey={activeFileSection}
                  onActiveKeyChange={setActiveFileSection}
                  onCreateDocument={(category) => { setDocGeneratorCategory(category); setIsDocGeneratorOpen(true); }}
                />
              </div>
            )}
          </div>
        </div>

        {isDocGeneratorOpen && (
          <div
            className="lawyer-doc-generator-overlay"
            onClick={() => { setIsDocGeneratorOpen(false); setDocGeneratorCategory(undefined); }}
          >
            <div
              className="lawyer-doc-generator-modal"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Create document"
            >
              <div className="lawyer-doc-generator-header">
                <div>
                  <h2>Create Document</h2>
                  {selectedCase && (
                    <p>
                      Case: {selectedCase.title} (#{selectedCase.caseId})
                    </p>
                  )}
                </div>
                <div className="lawyer-doc-generator-header-actions">
                  <a
                    href={docGeneratorCategory ? `${documentGeneratorSrc}&category=${encodeURIComponent(docGeneratorCategory)}` : documentGeneratorSrc}
                    target="_blank"
                    rel="noreferrer"
                    className="lawyer-doc-generator-open-tab"
                  >
                    Open in New Tab
                  </a>
                  <button
                    type="button"
                    className="lawyer-doc-generator-close-btn"
                    onClick={() => { setIsDocGeneratorOpen(false); setDocGeneratorCategory(undefined); }}
                  >
                    Close
                  </button>
                </div>
              </div>

              <iframe
                title="ASLAW Document Generator"
                src={docGeneratorCategory ? `${documentGeneratorSrc}&category=${encodeURIComponent(docGeneratorCategory)}` : documentGeneratorSrc}
                className="lawyer-doc-generator-iframe"
              />
            </div>
          </div>
        )}

        {selectedCase && (
          <Modal show={isEditCaseOpen} onHide={() => setIsEditCaseOpen(false)} centered>
            <Modal.Header closeButton>
              <Modal.Title>Edit Case Information</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Title</Form.Label>
                  <Form.Control
                    type="text"
                    value={caseForm.title}
                    onChange={(event) => setCaseForm((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="Enter case title"
                      readOnly
                      disabled
                  />
                    <Form.Text className="text-muted">The case title is locked.</Form.Text>
                </Form.Group>

                <Form.Group>
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={caseForm.description}
                    onChange={(event) => setCaseForm((prev) => ({ ...prev, description: event.target.value }))}
                    placeholder="Enter case description"
                  />
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setIsEditCaseOpen(false)} disabled={savingCase}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCaseEditSave} disabled={savingCase}>
                {savingCase ? "Saving..." : "Save Changes"}
              </Button>
            </Modal.Footer>
          </Modal>
        )}
      </div>
    </>
  );
};

export default UpdateCase;