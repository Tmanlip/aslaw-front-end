import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Dropdown from "react-bootstrap/Dropdown";
import DocumentsSection from "./UpdateDocument";
import ReportsSection from "./UpdateReport";
import InvoicesSection from "./UpdateCheque";
import ConfirmModal from "../../../../../../components/Modals/ConfirmModal";
import { EncryptedDocumentItem } from "../../../../../../data/userInfo";
import axiosUser from "../../../../../../api/axiosUser";
import AuthMemory from "../../../../../../data/authMemory";
import LoadingSpinner from "../../../../../../components/ui/Spinner";
import axios from "axios";

interface FileSectionProps {
  fileListUrl: string;
  selectedCase?: {
    lawyerFirmID: string;
    clientFirmID?: string;
    caseId?: string;
    status?: string;
    clientId?: number;
    lawyerId?: number;
    blob_folder_path?: string;
    title?: string;
    expected_payment_phases?: {
      initial: number;
      first: number;
      second: number;
      third: number;
      final: number;
    };
    invoice_payment_phases?: {
      initial: { expected: number; paid: number; balance: number };
      first: { expected: number; paid: number; balance: number };
      second: { expected: number; paid: number; balance: number };
      third: { expected: number; paid: number; balance: number };
      final: { expected: number; paid: number; balance: number };
    };
    encrypted_documents?: EncryptedDocumentItem[];
  };
  onUploadSuccess?: () => void;
  onDeleteSuccess?: () => void;
  onCaseProgressUpdate?: (caseId: number, progress: number) => void;
  onPhaseSnapshotChange?: (snapshot: {
    expected_payment_phases?: {
      initial: number;
      first: number;
      second: number;
      third: number;
      final: number;
    } | null;
    invoice_payment_phases?: {
      initial: { expected: number; paid: number; balance: number };
      first: { expected: number; paid: number; balance: number };
      second: { expected: number; paid: number; balance: number };
      third: { expected: number; paid: number; balance: number };
      final: { expected: number; paid: number; balance: number };
    } | null;
  }) => void;
  activeKey?: string;
  onActiveKeyChange?: (key: string) => void;
}

type PhaseSnapshot = {
  expected_payment_phases?: {
    initial: number;
    first: number;
    second: number;
    third: number;
    final: number;
  } | null;
  invoice_payment_phases?: {
    initial: { expected: number; paid: number; balance: number };
    first: { expected: number; paid: number; balance: number };
    second: { expected: number; paid: number; balance: number };
    third: { expected: number; paid: number; balance: number };
    final: { expected: number; paid: number; balance: number };
  } | null;
};

type FileSortMode = "modified_desc" | "modified_asc" | "name_asc" | "name_desc" | "category_asc";

const FileSection: React.FC<FileSectionProps> = ({
  fileListUrl,
  selectedCase,
  onUploadSuccess,
  onDeleteSuccess,
  onCaseProgressUpdate,
  onPhaseSnapshotChange,
  activeKey,
  onActiveKeyChange,
}) => {
  const resolvedActiveKey = activeKey ?? "recent";
  const [recentFiles, setRecentFiles] = useState<EncryptedDocumentItem[]>([]);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [isDocGeneratorOpen, setIsDocGeneratorOpen] = useState(false);
  const [docGeneratorPopupSrc, setDocGeneratorPopupSrc] = useState<string>("");
  const [docGeneratorCaseMeta, setDocGeneratorCaseMeta] = useState<{ caseId: string; caseTitle: string } | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingDeleteFile, setPendingDeleteFile] = useState<EncryptedDocumentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingReviewMessage, setPendingReviewMessage] = useState<string | null>(null);
  const [pendingUpdateFile, setPendingUpdateFile] = useState<EncryptedDocumentItem | null>(null);
  const [updateInvoiceData, setUpdateInvoiceData] = useState<any | null>(null);
  const [updateCaseFinancials, setUpdateCaseFinancials] = useState<any | null>(null);
  const [updatePaidAmountValue, setUpdatePaidAmountValue] = useState<string>("");
  const [updatePaymentStageValue, setUpdatePaymentStageValue] = useState<string>("initial");
  const [updateTypeOfWorkValue, setUpdateTypeOfWorkValue] = useState<string>("");
  const [updateTaxValue, setUpdateTaxValue] = useState<string>("0");
  const [updateDiscountValue, setUpdateDiscountValue] = useState<string>("0");
  const [isUpdatingInvoice, setIsUpdatingInvoice] = useState(false);
  const [livePhaseSnapshot, setLivePhaseSnapshot] = useState<PhaseSnapshot | null>(null);
  const [fileSortMode, setFileSortMode] = useState<FileSortMode>("modified_desc");

  const resolvedExpectedPaymentPhases =
    livePhaseSnapshot?.expected_payment_phases || (selectedCase as any)?.expected_payment_phases || null;
  const resolvedInvoicePaymentPhases =
    livePhaseSnapshot?.invoice_payment_phases || (selectedCase as any)?.invoice_payment_phases || null;
  const selectedCaseId = String((selectedCase as any)?.caseId || "");

  const toMillis = (value?: string | null) => {
    if (!value) return 0;
    const millis = new Date(value).getTime();
    return Number.isFinite(millis) ? millis : 0;
  };

  const buildAuthHeaders = () => {
    const token =
      AuthMemory.getToken() ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("token") ||
      "";

    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const normalizeApiRelativeUrl = (url?: string): string => {
    const value = String(url || "");
    return value.startsWith("/api/") ? value.slice(4) : value;
  };

  const documentGeneratorSrc = useMemo(() => {
    const documentGeneratorUrl = `${window.location.origin}/document-generator`;

    const authToken = AuthMemory.getToken() || "";
    const returnTo = window.location.href;
    const today = new Date().toISOString().slice(0, 10);
    const caseTitle = String((selectedCase as any)?.title || "");
    const caseNumber = String((selectedCase as any)?.caseNumber || "");
    const caseDescription = String((selectedCase as any)?.description || caseTitle);
    const clientName = String((selectedCase as any)?.clientName || "");
    const lawyerName = String((selectedCase as any)?.lawyerName || "");
    const resolvedClientId = (selectedCase as any)?.clientFirmID ?? (selectedCase as any)?.clientID ?? (selectedCase as any)?.clientId ?? "";
    const resolvedLawyerId = (selectedCase as any)?.lawyerFirmID ?? (selectedCase as any)?.lawyerID ?? (selectedCase as any)?.lawyerId ?? "";
    const prefill = {
      Date: today,
      date: today,
      Reference: caseTitle,
      recipientName: clientName,
      companyName: String((selectedCase as any)?.clientFirmID || clientName),
      subject: caseTitle ? `Regarding ${caseTitle}` : "",
      message: caseDescription,
      senderName: lawyerName,
      senderTitle: "Lawyer",
      managerName: lawyerName,
      reason: caseDescription,
      meetingTitle: caseTitle,
      agenda: caseDescription,
      projectName: caseTitle,
      progress: caseDescription,
      reportTitle: caseTitle,
      preparedBy: lawyerName,
      objective: caseDescription,
      ClientName: clientName,
      PlaintiffName: clientName,
      CaseNumber: String((selectedCase as any)?.caseId || ""),
      ClaimDescription: caseDescription,
      BreachDetails: caseDescription,
      LawFirmName: lawyerName,
      LawyerName: lawyerName,
      GoodsOrServices: caseDescription,
      case_id: caseNumber || String((selectedCase as any)?.caseId || ""),
      caseNumber,
      case_title: caseTitle,
      invoice_number: "",
      lawyerID: String(resolvedLawyerId),
      payment_stage: "initial",
      issue_date: today,
      due_date: today,
      expected_amount: "",
      paid_amount: "",
      balance: "",
      tax: "",
      discount: "",
      total_amount: "",
      clientID: String(resolvedClientId),
      client_name: clientName,
      blob_path: "",
      invoice_payment_phases: resolvedInvoicePaymentPhases,
      expected_payment_phases: resolvedExpectedPaymentPhases,
      case_data: {
        caseId: (selectedCase as any)?.caseId,
        case_id: (selectedCase as any)?.caseId,
        caseNumber,
        title: caseTitle,
        description: caseDescription,
        status: String((selectedCase as any)?.status || ""),
        blob_folder_path: String((selectedCase as any)?.blob_folder_path || ""),
        clientId: resolvedClientId,
        clientID: resolvedClientId,
        clientFirmID: String((selectedCase as any)?.clientFirmID || ""),
        clientName,
        lawyerId: resolvedLawyerId,
        lawyerID: resolvedLawyerId,
        lawyerFirmID: String((selectedCase as any)?.lawyerFirmID || ""),
        lawyerName,
        expected_payment_phases: resolvedExpectedPaymentPhases,
        invoice_payment_phases: resolvedInvoicePaymentPhases,
      },
    };

    const params = new URLSearchParams({
      source: "aslaw-front-end",
      caseId: String((selectedCase as any)?.caseId || ""),
      case_id: String((selectedCase as any)?.caseId || ""),
      caseTitle: String((selectedCase as any)?.title || ""),
      case_status: String((selectedCase as any)?.status || ""),
      blob_folder_path: String((selectedCase as any)?.blob_folder_path || ""),
      access_token: authToken,
      return_to: returnTo,
      prefill: JSON.stringify(prefill),
    });

    const separator = documentGeneratorUrl.includes("?") ? "&" : "?";
    return `${documentGeneratorUrl}${separator}${params.toString()}`;
  }, [selectedCase, resolvedExpectedPaymentPhases, resolvedInvoicePaymentPhases]);

  useEffect(() => {
    setLivePhaseSnapshot(null);
  }, [selectedCaseId]);

  const openDocGeneratorPopup = (src: string, caseMeta?: { caseId: string; caseTitle: string }) => {
    Promise.resolve(onUploadSuccess?.()).catch((error) => {
    });
    setDocGeneratorPopupSrc(src);
    setDocGeneratorCaseMeta(caseMeta || null);
    setIsDocGeneratorOpen(true);
  };

  const openSection = (section: "documents" | "reports" | "invoices") => {
    onActiveKeyChange?.(section);
  };

  const getActionKey = (action: "preview" | "download" | "delete", file: EncryptedDocumentItem) =>
    `${action}-${file.document_id || file.file_name}`;

  useEffect(() => {
    const files = Array.isArray((selectedCase as any)?.encrypted_documents)
      ? ((selectedCase as any).encrypted_documents as EncryptedDocumentItem[])
      : [];

    const activeFiles = files.filter(
      (item) =>
        item?.status !== "deleted" &&
        String(item?.status || "").toLowerCase() !== "pending_approval"
    );
    setRecentFiles(activeFiles);
  }, [selectedCase]);

  const sortedRecentFiles = useMemo(() => {
    return [...recentFiles].sort((a, b) => {
      const aName = String(a.file_name || "").toLowerCase();
      const bName = String(b.file_name || "").toLowerCase();
      const aCategory = String(a.category || "").toLowerCase();
      const bCategory = String(b.category || "").toLowerCase();
      const aModified = toMillis((a as any).updated_at || a.created_at);
      const bModified = toMillis((b as any).updated_at || b.created_at);

      switch (fileSortMode) {
        case "modified_asc":
          return aModified - bModified || aName.localeCompare(bName);
        case "name_asc":
          return aName.localeCompare(bName) || bModified - aModified;
        case "name_desc":
          return bName.localeCompare(aName) || bModified - aModified;
        case "category_asc":
          return aCategory.localeCompare(bCategory) || bModified - aModified;
        case "modified_desc":
        default:
          return bModified - aModified || aName.localeCompare(bName);
      }
    });
  }, [fileSortMode, recentFiles]);

  const sortLabel = useMemo(() => {
    switch (fileSortMode) {
      case "modified_asc":
        return "Oldest Modified";
      case "name_asc":
        return "Name A-Z";
      case "name_desc":
        return "Name Z-A";
      case "category_asc":
        return "Category";
      case "modified_desc":
      default:
        return "Latest Modified";
    }
  }, [fileSortMode]);

  const pendingFiles = useMemo(() => {
    const files = Array.isArray((selectedCase as any)?.encrypted_documents)
      ? ((selectedCase as any).encrypted_documents as EncryptedDocumentItem[])
      : [];

    return files.filter((item) => String(item?.status || "").toLowerCase() === "pending_approval");
  }, [selectedCase]);

  const handlePendingReview = async (file: EncryptedDocumentItem, action: "approve" | "reject") => {
    const documentId = String(file?.document_id || "").trim();
    if (!documentId) {
      setPendingReviewMessage("Unable to resolve pending document ID.");
      return;
    }

    const actionKey = `review-${action}-${documentId}`;
    setLoadingAction(actionKey);
    setPendingReviewMessage(null);

    try {
      await axiosUser.post(`/encrypted-documents/${documentId}/review`,
        { action },
        { headers: buildAuthHeaders() }
      );

      setPendingReviewMessage(
        action === "approve" ? "Document approved successfully." : "Document rejected successfully."
      );

      await Promise.resolve(onUploadSuccess?.());
    } catch (error: any) {
      if (error?.response?.status === 404) {
        setPendingReviewMessage("This pending document no longer exists. The list has been refreshed.");
        await Promise.resolve(onUploadSuccess?.());
        return;
      }

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to review pending document.";
      setPendingReviewMessage(message);
    } finally {
      setLoadingAction((current) => (current === actionKey ? null : current));
    }
  };

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
    if (!isDocGeneratorOpen) return;

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
          onCaseProgressUpdate?.(targetCaseId, nextProgress);
        }

        return;
      }

      if (payload.type !== "ASLAW_DOCUMENT_UPLOADED") return;

      const targetCaseId = Number(payload.case_id || 0);
      const nextProgress = Number(payload.case_progress);

      if (Number.isFinite(targetCaseId) && targetCaseId > 0 && Number.isFinite(nextProgress)) {
        onCaseProgressUpdate?.(targetCaseId, nextProgress);
      }

      setIsDocGeneratorOpen(false);

      Promise.resolve(onUploadSuccess?.()).catch((error) => {
      });

      // Some API responses can be eventually consistent for encrypted_documents.
      window.setTimeout(() => {
        Promise.resolve(onUploadSuccess?.()).catch(() => {
          // Silent retry to keep UX smooth.
        });
      }, 600);
    };

    window.addEventListener("message", handleGeneratorMessage);
    return () => window.removeEventListener("message", handleGeneratorMessage);
  }, [onCaseProgressUpdate, onUploadSuccess]);

  const openRecentPreview = async (file: EncryptedDocumentItem) => {
    const actionKey = getActionKey("preview", file);
    setLoadingAction(actionKey);

    try {
      const response = await axiosUser.get(normalizeApiRelativeUrl(file.preview_url), {
        responseType: "blob",
        headers: buildAuthHeaders(),
      });

      if (previewFile) {
        URL.revokeObjectURL(previewFile);
      }

      const objectUrl = URL.createObjectURL(response.data as Blob);
      setPreviewFile(objectUrl);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
      }
    } finally {
      setLoadingAction((current) => (current === actionKey ? null : current));
    }
  };

  const downloadRecentFile = async (file: EncryptedDocumentItem) => {
    const actionKey = getActionKey("download", file);
    setLoadingAction(actionKey);

    try {
      const response = await axiosUser.get(normalizeApiRelativeUrl(file.download_url), {
        responseType: "blob",
        headers: buildAuthHeaders(),
      });

      const objectUrl = URL.createObjectURL(response.data as Blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = file.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
      }
    } finally {
      setLoadingAction((current) => (current === actionKey ? null : current));
    }
  };

  const closeRecentPreview = () => {
    if (previewFile) {
      URL.revokeObjectURL(previewFile);
    }
    setPreviewFile(null);
  };

  const handleRecentDelete = (file: EncryptedDocumentItem) => {
    setPendingDeleteFile(file);
  };

  const confirmRecentDelete = async () => {
    if (!pendingDeleteFile) {
      return;
    }

    const actionKey = getActionKey("delete", pendingDeleteFile);
    setIsDeleting(true);
    setLoadingAction(actionKey);

    try {
      await axiosUser.delete(`/encrypted-documents/${pendingDeleteFile.document_id}`, {
        headers: buildAuthHeaders(),
      });
      setRecentFiles((prev) => prev.filter((item) => item.document_id !== pendingDeleteFile.document_id));
      onDeleteSuccess?.();
      setPendingDeleteFile(null);
    } catch (error) {
    } finally {
      setIsDeleting(false);
      setLoadingAction((current) => (current === actionKey ? null : current));
    }
  };

  void fileListUrl;

  return (
    <div style={{ marginTop: "1.25rem" }}>
      {resolvedActiveKey === "recent" && (
        <div className="admin-billing-recent-panel">
          <div className="admin-billing-files-header">
            <h2 className="admin-billing-files-title">Recent Files</h2>
            <div className="admin-billing-files-actions">
              <Dropdown>
                <Dropdown.Toggle
                  className="admin-billing-file-btn admin-billing-file-btn-preview"
                  variant="primary"
                  id="recent-upload-dropdown"
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <LoadingSpinner size={16} color="#ffffff" />
                      Uploading...
                    </>
                  ) : (
                    "Upload File"
                  )}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => openSection("documents")}>Upload to Documents</Dropdown.Item>
                  <Dropdown.Item onClick={() => openSection("reports")}>Upload to Reports</Dropdown.Item>
                  <Dropdown.Item onClick={() => openSection("invoices")}>Upload to Invoices</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>

              <button
                type="button"
                className="admin-billing-file-btn admin-billing-file-btn-delete"
                onClick={() =>
                  openDocGeneratorPopup(documentGeneratorSrc, {
                    caseId: String((selectedCase as any)?.caseId || ""),
                    caseTitle: String((selectedCase as any)?.title || ""),
                  })
                }
                disabled={!selectedCase}
              >
                Create
              </button>

              <Dropdown>
                <Dropdown.Toggle className="admin-billing-file-btn admin-billing-file-btn-download" variant="secondary" id="recent-select-dropdown">
                  Select
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => openSection("documents")}>Select in Documents</Dropdown.Item>
                  <Dropdown.Item onClick={() => openSection("reports")}>Select in Reports</Dropdown.Item>
                  <Dropdown.Item onClick={() => openSection("invoices")}>Select in Invoices</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>

              <Dropdown>
                <Dropdown.Toggle className="admin-billing-file-btn admin-billing-file-btn-download" variant="secondary" id="recent-sort-dropdown">
                  Sort: {sortLabel}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => setFileSortMode("modified_desc")}>Latest Modified</Dropdown.Item>
                  <Dropdown.Item onClick={() => setFileSortMode("modified_asc")}>Oldest Modified</Dropdown.Item>
                  <Dropdown.Item onClick={() => setFileSortMode("name_asc")}>Name A-Z</Dropdown.Item>
                  <Dropdown.Item onClick={() => setFileSortMode("name_desc")}>Name Z-A</Dropdown.Item>
                  <Dropdown.Item onClick={() => setFileSortMode("category_asc")}>Category</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>

          <p className="admin-billing-recent-note">
            Upload and Select let you choose section. Create opens Document Generator directly.
          </p>

          <ul className="admin-billing-file-list">
            {sortedRecentFiles.length === 0 && <p className="admin-billing-empty-list">No recent files found</p>}
            {sortedRecentFiles.map((file) => (
              <li key={file.document_id} className="admin-billing-file-row">
                <div className="admin-billing-file-main">
                  <strong className="admin-billing-file-name">{file.file_name}</strong>
                  <span className="admin-billing-file-badge-encrypted">{file.category.toUpperCase()}</span>
                </div>

                <div className="admin-billing-file-actions">
                  <button
                    type="button"
                    className="admin-billing-file-btn admin-billing-file-btn-preview"
                    onClick={() => void openRecentPreview(file)}
                    disabled={loadingAction === getActionKey("preview", file)}
                  >
                    {loadingAction === getActionKey("preview", file) ? (
                      <>
                        <LoadingSpinner size={16} color="#ffffff" />
                        Previewing
                      </>
                    ) : (
                      "Preview"
                    )}
                  </button>
                  <button
                    type="button"
                    className="admin-billing-file-btn admin-billing-file-btn-download"
                    onClick={() => void downloadRecentFile(file)}
                    disabled={loadingAction === getActionKey("download", file)}
                  >
                    {loadingAction === getActionKey("download", file) ? (
                      <>
                        <LoadingSpinner size={16} color="#ffffff" />
                        Downloading
                      </>
                    ) : (
                      "Download"
                    )}
                  </button>
                  <button
                    type="button"
                    className="admin-billing-file-btn admin-billing-file-btn-delete"
                    onClick={() => handleRecentDelete(file)}
                    disabled={loadingAction === getActionKey("delete", file)}
                  >
                    {loadingAction === getActionKey("delete", file) ? (
                      <>
                        <LoadingSpinner size={16} color="#ffffff" />
                        Deleting
                      </>
                    ) : (
                      "Delete"
                    )}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {resolvedActiveKey === "pending" && (
        <div className="admin-billing-recent-panel">
          <div className="admin-billing-files-header">
            <h2 className="admin-billing-files-title">Pending Review</h2>
          </div>

          <p className="admin-billing-recent-note">
            Client-uploaded files stay here until an admin or lawyer approves or rejects them.
          </p>

          {pendingReviewMessage ? (
            <p className="admin-billing-recent-note" style={{ color: "#0f766e", marginTop: "0.5rem" }}>
              {pendingReviewMessage}
            </p>
          ) : null}

          <ul className="admin-billing-file-list">
            {pendingFiles.length === 0 && <p className="admin-billing-empty-list">No pending files found</p>}

            {pendingFiles.map((file) => {
              const documentId = String(file.document_id || "");
              const previewActionKey = getActionKey("preview", file);
              const approveActionKey = `review-approve-${documentId}`;
              const rejectActionKey = `review-reject-${documentId}`;
              const isPreviewing = loadingAction === previewActionKey;
              const isApproving = loadingAction === approveActionKey;
              const isRejecting = loadingAction === rejectActionKey;

              return (
                <li key={file.document_id} className="admin-billing-file-row">
                  <div className="admin-billing-file-main">
                    <strong className="admin-billing-file-name">{file.file_name}</strong>
                    <span className="admin-billing-file-badge-encrypted">{String(file.category || "documents").toUpperCase()}</span>
                  </div>

                  <div className="admin-billing-file-actions">
                    <button
                      type="button"
                      className="admin-billing-file-btn admin-billing-file-btn-download"
                      onClick={() => void openRecentPreview(file)}
                      disabled={isPreviewing || isApproving || isRejecting}
                    >
                      {isPreviewing ? (
                        <>
                          <LoadingSpinner size={16} color="#ffffff" />
                          Previewing
                        </>
                      ) : (
                        "Preview"
                      )}
                    </button>

                    <button
                      type="button"
                      className="admin-billing-file-btn admin-billing-file-btn-preview"
                      onClick={() => void handlePendingReview(file, "approve")}
                      disabled={isPreviewing || isApproving || isRejecting}
                    >
                      {isApproving ? (
                        <>
                          <LoadingSpinner size={16} color="#ffffff" />
                          Approving
                        </>
                      ) : (
                        "Approve"
                      )}
                    </button>

                    <button
                      type="button"
                      className="admin-billing-file-btn admin-billing-file-btn-delete"
                      onClick={() => void handlePendingReview(file, "reject")}
                      disabled={isPreviewing || isApproving || isRejecting}
                    >
                      {isRejecting ? (
                        <>
                          <LoadingSpinner size={16} color="#ffffff" />
                          Rejecting
                        </>
                      ) : (
                        "Reject"
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <ConfirmModal
        show={pendingDeleteFile !== null}
        title="Delete File"
        confirmText="Delete"
        confirmingText="Deleting..."
        isConfirming={isDeleting}
        onConfirm={() => void confirmRecentDelete()}
        onCancel={() => setPendingDeleteFile(null)}
      >
        {pendingDeleteFile ? (
          <p style={{ marginBottom: 0 }}>
            Are you sure you want to delete "{pendingDeleteFile.file_name}"? This action cannot be undone.
          </p>
        ) : null}
      </ConfirmModal>

      {pendingUpdateFile && updateInvoiceData && (() => {
        const inv = updateInvoiceData;
        const stage = String(updatePaymentStageValue || inv.payment_stage || "").toLowerCase();
        const stageKey = ["initial", "first", "second", "third", "final"].includes(stage) ? stage : "initial";
        const parseCaseTypeFeeJson = (candidate: any) => {
          if (!candidate) {
            return null;
          }

          if (typeof candidate === "string") {
            try {
              return JSON.parse(candidate);
            } catch {
              return null;
            }
          }

          if (typeof candidate === "object") {
            return candidate;
          }

          return null;
        };
        const caseTypeFeeJson =
          parseCaseTypeFeeJson(inv.case_type_fee_json) ||
          parseCaseTypeFeeJson((selectedCase as any)?.case_type_fee_json);
        const stageItems = Array.isArray(caseTypeFeeJson?.[stageKey]) ? caseTypeFeeJson[stageKey] : [];
        const resolveTypeOfWork = () => {
          const directTypeOfWork = String(inv.type_of_work || inv.typeOfWork || "").trim();
          if (directTypeOfWork) {
            return directTypeOfWork;
          }

          if (!stageItems.length) {
            return "-";
          }

          if (stageItems.length === 1) {
            return String(stageItems[0]?.typeOfWork || stageItems[0]?.type_of_work || "-").trim() || "-";
          }

          const expectedAmount = Number(inv.expected_amount || 0);
          if (expectedAmount > 0) {
            const matched = stageItems.find((item: any) => Number(item?.selectedFee || 0) === expectedAmount);
            if (matched) {
              return String(matched?.typeOfWork || matched?.type_of_work || "-").trim() || "-";
            }
          }

          const firstType = String(stageItems[0]?.typeOfWork || stageItems[0]?.type_of_work || "").trim();
          return firstType ? `${firstType} (+${stageItems.length - 1} more)` : "-";
        };
        const resolvedTypeOfWork = resolveTypeOfWork();
        const resolvedPhaseBalance = Number(
          inv.phase_balance ??
            updateCaseFinancials?.balance_payment_phases?.[stageKey] ??
            (selectedCase as any)?.invoice_payment_phases?.[stageKey]?.balance ??
            0
        );
        const newPaid = Number(updatePaidAmountValue || 0);
        const expected = Number(inv.expected_amount || 0);
        const taxPct = Number(updateTaxValue || 0);
        const discountPct = Number(updateDiscountValue || 0);
        const newBalance = Math.max(expected - newPaid, 0);
        const taxAmt = (newPaid * taxPct) / 100;
        const discountAmt = (newPaid * discountPct) / 100;
        const newTotal = newPaid + taxAmt - discountAmt;
        const fmt = (value: number) =>
          new Intl.NumberFormat("en-MY", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(value);

        const closeUpdateModal = () => {
          setPendingUpdateFile(null);
          setUpdateInvoiceData(null);
          setUpdateCaseFinancials(null);
          setUpdatePaidAmountValue("");
          setUpdatePaymentStageValue("initial");
          setUpdateTypeOfWorkValue("");
          setUpdateTaxValue("0");
          setUpdateDiscountValue("0");
        };

        const submitUpdate = async () => {
          if (!Number.isFinite(newPaid) || newPaid < 0) {
            return;
          }
          if (!["initial", "first", "second", "third", "final"].includes(stageKey)) {
            return;
          }
          if (!Number.isFinite(taxPct) || taxPct < 0 || !Number.isFinite(discountPct) || discountPct < 0) {
            return;
          }

          setIsUpdatingInvoice(true);
          try {
            const mutationHeaders = buildAuthHeaders();
            await axiosUser.put(`/encrypted-documents/${pendingUpdateFile.document_id}/invoice`,
              {
                paid_amount: newPaid,
                payment_stage: stageKey,
                type_of_work: String(updateTypeOfWorkValue || "").trim(),
                tax: taxPct,
                discount: discountPct,
                balance: newBalance,
                total_amount: newTotal,
              },
              { headers: mutationHeaders }
            );
            closeUpdateModal();
            onUploadSuccess?.();
          } catch (err) {
          } finally {
            setIsUpdatingInvoice(false);
          }
        };

        return (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 3000,
              background: "rgba(0,0,0,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
            }}
            onClick={() => {
              if (!isUpdatingInvoice) {
                closeUpdateModal();
              }
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: "14px",
                width: "min(96vw, 560px)",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 16px 48px rgba(0,0,0,0.22)",
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "1rem 1.25rem 0.75rem",
                  borderBottom: "3px solid #c23b4d",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#c23b4d" }}>INVOICE</div>
                  <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "0.15rem" }}>
                    Update invoice fields
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeUpdateModal}
                  disabled={isUpdatingInvoice}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "1.4rem",
                    cursor: isUpdatingInvoice ? "not-allowed" : "pointer",
                    color: "#64748b",
                    lineHeight: 1,
                  }}
                >
                  x
                </button>
              </div>

              <div style={{ padding: "1rem 1.25rem" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.5rem 1rem",
                    background: "#f8fafc",
                    borderRadius: "10px",
                    padding: "0.85rem 1rem",
                    marginBottom: "1rem",
                    fontSize: "0.9rem",
                  }}
                >
                  <div><span style={{ color: "#64748b" }}>Invoice No.</span><br /><strong>{inv.invoice_number || pendingUpdateFile.file_name || "-"}</strong></div>
                  <div>
                    <span style={{ color: "#64748b" }}>Payment Stage</span><br />
                    <select
                      value={updatePaymentStageValue}
                      onChange={(event) => setUpdatePaymentStageValue(event.target.value)}
                      disabled={isUpdatingInvoice}
                      style={{ width: "100%", marginTop: "0.2rem", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "0.32rem 0.45rem", textTransform: "capitalize" }}
                    >
                      <option value="initial">Initial</option>
                      <option value="first">First</option>
                      <option value="second">Second</option>
                      <option value="third">Third</option>
                      <option value="final">Final</option>
                    </select>
                  </div>
                  <div><span style={{ color: "#64748b" }}>Type of Work</span><br /><strong>{String(updateTypeOfWorkValue || "").trim() || resolvedTypeOfWork}</strong></div>
                  <div><span style={{ color: "#64748b" }}>Client</span><br /><strong>{inv.client_name || "-"}</strong></div>
                  <div><span style={{ color: "#64748b" }}>Case</span><br /><strong>{inv.case_title || "-"}</strong></div>
                  <div><span style={{ color: "#64748b" }}>Issue Date</span><br /><strong>{inv.issue_date || "-"}</strong></div>
                  <div><span style={{ color: "#64748b" }}>Due Date</span><br /><strong>{inv.due_date || "-"}</strong></div>
                  <div style={{ gridColumn: "1 / span 2" }}>
                    <span style={{ color: "#64748b" }}>Type of Work (Editable)</span><br />
                    <input
                      type="text"
                      value={updateTypeOfWorkValue}
                      onChange={(event) => setUpdateTypeOfWorkValue(event.target.value)}
                      disabled={isUpdatingInvoice}
                      placeholder="Type of Work"
                      style={{ width: "100%", marginTop: "0.2rem", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "0.38rem 0.5rem" }}
                    />
                  </div>
                </div>

                <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden", marginBottom: "1rem" }}>
                  {[
                    { label: "Expected Amount", value: `RM ${fmt(expected)}` },
                    { label: "Tax", value: `${taxPct}%` },
                    { label: "Discount", value: `${discountPct}%` },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.6rem 1rem",
                        borderBottom: "1px solid #f1f5f9",
                        fontSize: "0.9rem",
                        color: "#64748b",
                      }}
                    >
                      <span>{label}</span>
                      <span style={{ fontWeight: 600, color: "#1e293b" }}>{value}</span>
                    </div>
                  ))}

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.65rem 1rem",
                      borderBottom: "1px solid #f1f5f9",
                      background: "#f8fafc",
                    }}
                  >
                    <label htmlFor="recent-update-tax-input" style={{ fontWeight: 600, color: "#334155", fontSize: "0.9rem" }}>
                      Tax (%)
                    </label>
                    <input
                      id="recent-update-tax-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={updateTaxValue}
                      onChange={(event) => setUpdateTaxValue(event.target.value)}
                      style={{ width: "140px", padding: "0.4rem 0.65rem", borderRadius: "7px", border: "1px solid #cbd5e1", fontSize: "0.95rem", fontWeight: 700, textAlign: "right" }}
                      disabled={isUpdatingInvoice}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.65rem 1rem",
                      borderBottom: "1px solid #f1f5f9",
                      background: "#f8fafc",
                    }}
                  >
                    <label htmlFor="recent-update-discount-input" style={{ fontWeight: 600, color: "#334155", fontSize: "0.9rem" }}>
                      Discount (%)
                    </label>
                    <input
                      id="recent-update-discount-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={updateDiscountValue}
                      onChange={(event) => setUpdateDiscountValue(event.target.value)}
                      style={{ width: "140px", padding: "0.4rem 0.65rem", borderRadius: "7px", border: "1px solid #cbd5e1", fontSize: "0.95rem", fontWeight: 700, textAlign: "right" }}
                      disabled={isUpdatingInvoice}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.6rem 1rem",
                      borderBottom: "1px solid #f1f5f9",
                      fontSize: "0.9rem",
                      background: "#e0f2fe",
                    }}
                  >
                    <span style={{ fontWeight: 600, color: "#0369a1" }}>Phase Balance</span>
                    <span style={{ fontWeight: 700, color: "#0369a1" }}>RM {fmt(resolvedPhaseBalance)}</span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.65rem 1rem",
                      borderBottom: "1px solid #f1f5f9",
                      background: "#fffbeb",
                    }}
                  >
                    <label htmlFor="recent-update-paid-input" style={{ fontWeight: 600, color: "#92400e", fontSize: "0.9rem" }}>
                      Paid Amount (RM)
                    </label>
                    <input
                      id="recent-update-paid-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={updatePaidAmountValue}
                      onChange={(event) => setUpdatePaidAmountValue(event.target.value)}
                      style={{
                        width: "140px",
                        padding: "0.4rem 0.65rem",
                        borderRadius: "7px",
                        border: "2px solid #c23b4d",
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        textAlign: "right",
                      }}
                      disabled={isUpdatingInvoice}
                      autoFocus
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.6rem 1rem",
                      borderBottom: "1px solid #f1f5f9",
                      fontSize: "0.9rem",
                      background: "#f0fdf4",
                    }}
                  >
                    <span style={{ color: "#15803d", fontWeight: 600 }}>Balance</span>
                    <span style={{ fontWeight: 700, color: "#15803d" }}>RM {fmt(newBalance)}</span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.7rem 1rem",
                      background: "#fff7ed",
                      fontSize: "1rem",
                    }}
                  >
                    <span style={{ fontWeight: 700, color: "#7c3aed" }}>Total Amount</span>
                    <span style={{ fontWeight: 800, color: "#7c3aed" }}>RM {fmt(newTotal)}</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={closeUpdateModal}
                    disabled={isUpdatingInvoice}
                    style={{
                      padding: "0.55rem 1.2rem",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      background: "#fff",
                      cursor: isUpdatingInvoice ? "not-allowed" : "pointer",
                      opacity: isUpdatingInvoice ? 0.6 : 1,
                      fontWeight: 600,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void submitUpdate()}
                    disabled={isUpdatingInvoice}
                    style={{
                      padding: "0.55rem 1.4rem",
                      borderRadius: "8px",
                      background: "#c23b4d",
                      color: "#fff",
                      border: "none",
                      cursor: isUpdatingInvoice ? "not-allowed" : "pointer",
                      opacity: isUpdatingInvoice ? 0.7 : 1,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    {isUpdatingInvoice ? (
                      <>
                        <LoadingSpinner size={14} color="#fff" /> Updating...
                      </>
                    ) : (
                    "Update"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {previewFile &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.7)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 2200,
            }}
            onClick={closeRecentPreview}
          >
            <div
              style={{
                width: "min(95vw, 1100px)",
                height: "min(90vh, 900px)",
                background: "white",
                borderRadius: "10px",
                overflow: "hidden",
                position: "relative",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <iframe
                src={previewFile}
                style={{ width: "100%", height: "100%", border: "none" }}
                title="Recent File Preview"
              />

              <button
                onClick={closeRecentPreview}
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  background: "#c23b4d",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "0.5rem 1rem",
                }}
              >
                Close
              </button>
            </div>
          </div>,
          document.body
        )}

      {isDocGeneratorOpen &&
        createPortal(
          (() => {
            const activeGeneratorSrc = docGeneratorPopupSrc || documentGeneratorSrc;
            return (
          <div
            className="admin-doc-generator-overlay"
            onClick={() => setIsDocGeneratorOpen(false)}
          >
            <div
              className="admin-doc-generator-modal"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Create document"
            >
              <div className="admin-doc-generator-header">
                <div>
                  <h2>Create Document</h2>
                  <p>
                    Case: {docGeneratorCaseMeta?.caseTitle || (selectedCase as any)?.title || "-"} (#{docGeneratorCaseMeta?.caseId || (selectedCase as any)?.caseId || "-"})
                  </p>
                </div>
                <div className="admin-doc-generator-header-actions">
                  <a
                    href={activeGeneratorSrc}
                    target="_blank"
                    rel="noreferrer"
                    className="admin-doc-generator-open-tab"
                  >
                    Open in New Tab
                  </a>
                  <button
                    type="button"
                    className="admin-doc-generator-close-btn"
                    onClick={() => setIsDocGeneratorOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </div>

              <iframe
                title="ASALAW Document Generator"
                src={activeGeneratorSrc}
                className="admin-doc-generator-iframe"
              />
            </div>
          </div>
            );
          })(),
          document.body
        )}

      {resolvedActiveKey === "documents" && (
        <DocumentsSection
          selectedCase={selectedCase}
          onUploadingChange={setUploading}
          onCreateDocument={(cat) =>
            openDocGeneratorPopup(`${documentGeneratorSrc}&category=${encodeURIComponent(cat)}`, {
              caseId: String((selectedCase as any)?.caseId || ""),
              caseTitle: String((selectedCase as any)?.title || ""),
            })
          }
        />
      )}

      {resolvedActiveKey === "reports" && (
        <ReportsSection
          selectedCase={selectedCase}
          onCreateDocument={(cat) =>
            openDocGeneratorPopup(`${documentGeneratorSrc}&category=${encodeURIComponent(cat)}`, {
              caseId: String((selectedCase as any)?.caseId || ""),
              caseTitle: String((selectedCase as any)?.title || ""),
            })
          }
        />
      )}

      {resolvedActiveKey === "invoices" && (
        <InvoicesSection
          selectedCase={selectedCase}
          onUploadSuccess={onUploadSuccess}
          onDeleteSuccess={onDeleteSuccess}
          onUploadingChange={setUploading}
          onCaseProgressUpdate={onCaseProgressUpdate}
          onPhaseSnapshotChange={(snapshot) => {
            setLivePhaseSnapshot(snapshot);
            onPhaseSnapshotChange?.(snapshot);
          }}
          onCreateDocument={(cat) =>
            openDocGeneratorPopup(`${documentGeneratorSrc}&category=${encodeURIComponent(cat)}`, {
              caseId: String((selectedCase as any)?.caseId || ""),
              caseTitle: String((selectedCase as any)?.title || ""),
            })
          }
        />
      )}
    </div>
  );
};

export default FileSection;
