import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Dropdown from "react-bootstrap/Dropdown";
import ConfirmModal from "../../../components/Modals/ConfirmModal";
import AuthMemory from "../../../data/authMemory";
import axiosUser from "../../../api/axiosUser";
import { Case, EncryptedDocumentItem } from "../../../data/userInfo";
import CaseFolderSection from "../../../features/Lawyer/Pages/Update Case/components/Tabs/CaseSelectionFolder";
import LoadingSpinner from "../../../components/ui/Spinner";
import "../../../features/Admin/Pages/Billing/billing.css";

type ActiveFileSection = "recent" | "pending" | "documents" | "reports" | "invoices";
type FileSortMode = "modified_desc" | "modified_asc" | "name_asc" | "name_desc" | "category_asc";

interface CaseFileTabsProps {
  selectedCase: Case;
  readOnly?: boolean;
  lockInvoices?: boolean;
  onUploadSuccess?: () => void; // callback to refresh case data
  onDeleteSuccess?: () => void; // callback to refresh case data
  activeKey?: ActiveFileSection;
  onActiveKeyChange?: (key: ActiveFileSection) => void;
  onCreateDocument?: (category?: string) => void;
}

const CaseFileTabs: React.FC<CaseFileTabsProps> = ({
  selectedCase,
  readOnly = false,
  lockInvoices = false,
  onUploadSuccess,
  onDeleteSuccess,
  activeKey,
  onActiveKeyChange,
  onCreateDocument,
}) => {
  const currentUser = AuthMemory.getUser();
  const [internalActiveKey, setInternalActiveKey] = useState<ActiveFileSection>("recent");
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [recentFiles, setRecentFiles] = useState<EncryptedDocumentItem[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingDeleteFile, setPendingDeleteFile] = useState<EncryptedDocumentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);
  const [reviewMessageVariant, setReviewMessageVariant] = useState<"success" | "danger">("success");
  const [fileSortMode, setFileSortMode] = useState<FileSortMode>("modified_desc");

  const toMillis = (value?: string | null) => {
    if (!value) return 0;
    const millis = new Date(value).getTime();
    return Number.isFinite(millis) ? millis : 0;
  };

  const resolvedActiveKey = activeKey ?? internalActiveKey;
  const setResolvedActiveKey = (key: ActiveFileSection) => {
    setInternalActiveKey(key);
    onActiveKeyChange?.(key);
  };

  useEffect(() => {
    const sorted = (selectedCase?.encrypted_documents || [])
      .filter((item) => item.status !== "deleted")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setRecentFiles(sorted);
  }, [selectedCase?.encrypted_documents]);

  const token = AuthMemory.getToken();
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  const getActionKey = (action: "preview" | "download" | "delete" | "approve" | "reject", file: EncryptedDocumentItem) =>
    `${action}-${file.document_id || file.file_name}`;
  const normalizeApiRelativeUrl = (url?: string): string => {
    const value = String(url || "");
    return value.startsWith("/api/") ? value.slice(4) : value;
  };

  const isArchived = (selectedCase.status || "").toLowerCase() === "archived";
  const lockArchivedActions = isArchived;
  const role = (currentUser?.role || "").toLowerCase();
  const canMutateInvoices = !readOnly && role === "admin";
  const showInvoiceLockBanner = lockInvoices && role === "lawyer";
  const canMutateGeneralFiles = !readOnly && !lockArchivedActions;
  const showUploadMenu = !readOnly && !lockArchivedActions;
  const showInvoiceActions = role === "admin" && !showInvoiceLockBanner;
  const canReviewPending = role === "admin" || role === "lawyer";
  const forceArchivedInvoiceView = showInvoiceLockBanner;
  const forceReadOnlyPreviewView = readOnly;
  const displayedRecentFiles = useMemo(() => {
    const activeFiles = recentFiles.filter(
      (item) => String(item.status || "").toLowerCase() !== "pending_approval"
    );

    return [...activeFiles].sort((a, b) => {
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

  const pendingFiles = useMemo(() => {
    return recentFiles.filter((item) => String(item.status || "").toLowerCase() === "pending_approval");
  }, [recentFiles]);

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

  const reviewPendingFile = async (file: EncryptedDocumentItem, action: "approve" | "reject") => {
    const actionKey = getActionKey(action, file);
    setLoadingAction(actionKey);

    try {
      await axiosUser.post(`/encrypted-documents/${file.document_id}/review`,
        { action },
        { headers: authHeaders }
      );

      if (action === "approve") {
        setRecentFiles((prev) =>
          prev.map((item) =>
            item.document_id === file.document_id ? { ...item, status: "active" } : item
          )
        );
        setReviewMessage(`Approved "${file.file_name}" successfully.`);
        setReviewMessageVariant("success");
      } else {
        setRecentFiles((prev) => prev.filter((item) => item.document_id !== file.document_id));
        setReviewMessage(`Rejected "${file.file_name}" and removed it permanently from storage.`);
        setReviewMessageVariant("danger");
      }

      onUploadSuccess?.();
    } catch (error) {
      console.error(`Failed to ${action} pending file`, error);
      setReviewMessage(`Failed to ${action} "${file.file_name}".`);
      setReviewMessageVariant("danger");
    } finally {
      setLoadingAction((current) => (current === actionKey ? null : current));
    }
  };

  const openRecentPreview = async (file: EncryptedDocumentItem) => {
    const actionKey = getActionKey("preview", file);
    setLoadingAction(actionKey);

    try {
      const response = await axiosUser.get(normalizeApiRelativeUrl(file.preview_url), {
        responseType: "blob",
        headers: authHeaders,
      });

      if (previewFile) {
        URL.revokeObjectURL(previewFile);
      }

      const objectUrl = URL.createObjectURL(response.data as Blob);
      setPreviewFile(objectUrl);
    } catch (error) {
      console.error("Failed to preview file from Recent", error);
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
        headers: authHeaders,
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
      console.error("Failed to download file from Recent", error);
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
        headers: authHeaders,
      });
      setRecentFiles((prev) => prev.filter((item) => item.document_id !== pendingDeleteFile.document_id));
      onDeleteSuccess?.();
      setPendingDeleteFile(null);
    } catch (error) {
      console.error("Failed to delete file from Recent", error);
    } finally {
      setIsDeleting(false);
      setLoadingAction((current) => (current === actionKey ? null : current));
    }
  };

  return (
    <div style={{ marginTop: "1.25rem" }}>
      {lockArchivedActions && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            backgroundColor: "#fff3cd",
            color: "#664d03",
            border: "1px solid #ffecb5",
          }}
        >
          This case is archived. Upload, delete, and case edits are locked.
        </div>
      )}

      {resolvedActiveKey === "recent" && (
        <div className="admin-billing-recent-panel">
          <div className="admin-billing-files-header">
            <h2 className="admin-billing-files-title">Recent Files</h2>
            <div className="admin-billing-files-actions">
              {!readOnly && showUploadMenu && (
                  <Dropdown>
                    <Dropdown.Toggle
                      className="admin-billing-file-btn admin-billing-file-btn-preview"
                      variant="primary"
                      id="recent-upload-dropdown-shared"
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
                      <Dropdown.Item onClick={() => setResolvedActiveKey("documents")}>Upload to Documents</Dropdown.Item>
                      <Dropdown.Item onClick={() => setResolvedActiveKey("reports")}>Upload to Reports</Dropdown.Item>
                      {showInvoiceActions && (
                        <Dropdown.Item onClick={() => setResolvedActiveKey("invoices")}>Upload to Invoices</Dropdown.Item>
                      )}
                    </Dropdown.Menu>
                  </Dropdown>
              )}

              {!readOnly && (
                <button
                  type="button"
                  className="admin-billing-file-btn admin-billing-file-btn-delete"
                  onClick={() => {
                    if (onCreateDocument) {
                      onCreateDocument();
                      return;
                    }
                    setResolvedActiveKey("documents");
                  }}
                  disabled={lockArchivedActions}
                >
                  Create
                </button>
              )}

              {!readOnly && (
                <Dropdown>
                  <Dropdown.Toggle className="admin-billing-file-btn admin-billing-file-btn-download" variant="secondary" id="recent-select-dropdown-shared">
                    Select
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => setResolvedActiveKey("documents")}>Select in Documents</Dropdown.Item>
                    <Dropdown.Item onClick={() => setResolvedActiveKey("reports")}>Select in Reports</Dropdown.Item>
                    {showInvoiceActions && <Dropdown.Item onClick={() => setResolvedActiveKey("invoices")}>Select in Invoices</Dropdown.Item>}
                  </Dropdown.Menu>
                </Dropdown>
              )}

                <Dropdown>
                  <Dropdown.Toggle className="admin-billing-file-btn admin-billing-file-btn-download" variant="secondary" id="recent-sort-dropdown-shared">
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
              {displayedRecentFiles.length === 0 && (
                <p className="admin-billing-empty-list">No recent files found</p>
              )}
              {displayedRecentFiles.map((file) => {
                const canDeleteThisFile =
                  canMutateGeneralFiles &&
                  (file.category !== "invoices" || canMutateInvoices);

                return (
                  <li key={file.document_id} className="admin-billing-file-row">
                    <div className="admin-billing-file-main">
                      <strong className="admin-billing-file-name">{file.file_name}</strong>
                      <span className="admin-billing-file-badge-encrypted">{file.category.toUpperCase()}</span>
                    </div>

                    <div className="admin-billing-file-actions">
                      <button
                        type="button"
                        className="admin-billing-file-btn admin-billing-file-btn-preview"
                        disabled={loadingAction === getActionKey("preview", file)}
                        onClick={() => void openRecentPreview(file)}
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
                        disabled={loadingAction === getActionKey("download", file)}
                        onClick={() => void downloadRecentFile(file)}
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

                      {!readOnly && (
                        <button
                          type="button"
                          className="admin-billing-file-btn admin-billing-file-btn-delete"
                          onClick={() => void handleRecentDelete(file)}
                          disabled={!canDeleteThisFile || loadingAction === getActionKey("delete", file)}
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
                      )}
                    </div>
                  </li>
                );
              })}
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

            {reviewMessage ? (
              <p className="admin-billing-recent-note" style={{ color: reviewMessageVariant === "success" ? "#0f766e" : "#b91c1c", marginTop: "0.5rem" }}>
                {reviewMessage}
              </p>
            ) : null}

            <ul className="admin-billing-file-list">
              {pendingFiles.length === 0 && <p className="admin-billing-empty-list">No pending files found</p>}

              {pendingFiles.map((file) => {
                const documentId = String(file.document_id || "");
                const previewActionKey = getActionKey("preview", file);
                const approveActionKey = `approve-${documentId}`;
                const rejectActionKey = `reject-${documentId}`;
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

                      {canReviewPending && (
                        <>
                          <button
                            type="button"
                            className="admin-billing-file-btn admin-billing-file-btn-preview"
                            onClick={() => void reviewPendingFile(file, "approve")}
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
                            onClick={() => void reviewPendingFile(file, "reject")}
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
                        </>
                      )}
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
              zIndex: 2600,
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

      {resolvedActiveKey === "documents" && (
        <CaseFolderSection
          selectedCase={selectedCase}
          folderName="documents"
          title="Documents"
          allowUpload={!readOnly}
          allowDelete={!readOnly}
          uploadDisabled={lockArchivedActions}
          deleteDisabled={lockArchivedActions}
          onUploadSuccess={onUploadSuccess}
          onDeleteSuccess={onDeleteSuccess}
          onUploadingChange={setUploading}
          onCreateDocument={onCreateDocument ? () => onCreateDocument("documents") : undefined}
          forceArchivedView={forceReadOnlyPreviewView}
        />
      )}

      {resolvedActiveKey === "reports" && (
        <CaseFolderSection
          selectedCase={selectedCase}
          folderName="reports"
          title="Reports"
          allowUpload={!readOnly}
          allowDelete={!readOnly}
          uploadDisabled={lockArchivedActions}
          deleteDisabled={lockArchivedActions}
          onUploadSuccess={onUploadSuccess}
          onDeleteSuccess={onDeleteSuccess}
          onUploadingChange={setUploading}
          onCreateDocument={onCreateDocument ? () => onCreateDocument("reports") : undefined}
          forceArchivedView={forceReadOnlyPreviewView}
        />
      )}

      {resolvedActiveKey === "invoices" && (
        <CaseFolderSection
          selectedCase={selectedCase}
          folderName="invoices"
          title="Invoices"
          sectionOptions={showInvoiceActions ? ["initial", "first", "second", "third", "final"] : []}
          renameFileWithSection={canMutateInvoices && !lockArchivedActions && !showInvoiceLockBanner}
          allowUpload={canMutateInvoices && !showInvoiceLockBanner}
          allowDelete={canMutateInvoices && !showInvoiceLockBanner}
          uploadDisabled={lockArchivedActions || showInvoiceLockBanner}
          deleteDisabled={lockArchivedActions || showInvoiceLockBanner}
          bannerMessage={showInvoiceLockBanner ? "Lawyers do not have access to manage invoices." : undefined}
          forceArchivedView={forceArchivedInvoiceView || forceReadOnlyPreviewView}
          onUploadSuccess={onUploadSuccess}
          onDeleteSuccess={onDeleteSuccess}
          onUploadingChange={setUploading}
          onCreateDocument={showInvoiceActions && onCreateDocument ? () => onCreateDocument("invoices") : undefined}
        />
      )}
    </div>
  );
};

export default CaseFileTabs;

