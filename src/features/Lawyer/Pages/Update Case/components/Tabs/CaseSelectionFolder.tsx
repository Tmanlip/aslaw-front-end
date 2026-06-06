// CaseFolderSection.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { colors } from "../../../../../../constant/color";
import Alert from "react-bootstrap/Alert";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import ConfirmModal from "../../../../../../components/Modals/ConfirmModal";
import { Case, EncryptedDocumentItem } from "../../../../../../data/userInfo";
import AuthMemory from "../../../../../../data/authMemory";
import axiosUser from "../../../../../../api/axiosUser";
import { resolveApiBaseUrl } from "../../../../../../api/resolveApiBaseUrl";
import LoadingSpinner from "../../../../../../components/ui/Spinner";
import InvoicePhaseSummary from "../../../../../../shared/components/InvoicePhaseSummary";

interface CaseFolderSectionProps {
  selectedCase?: Case;
  folderName: string; // e.g., "documents" or "invoices"
  sectionOptions?: string[]; // optional section dropdown
  renameFileWithSection?: boolean; // if true, adds section prefix on upload
  title: string; // Header title
  allowUpload?: boolean;
  allowDelete?: boolean;
  uploadDisabled?: boolean;
  deleteDisabled?: boolean;
  bannerMessage?: string;
  forceArchivedView?: boolean;
  onUploadSuccess?: () => void; // callback to refresh parent data after upload
  onDeleteSuccess?: () => void; // callback to refresh parent data after delete
  onUploadingChange?: (uploading: boolean) => void;
  onCreateDocument?: (category: string) => void;
}

const formatStageLabel = (stage: string) => stage.charAt(0).toUpperCase() + stage.slice(1);

const CaseFolderSection: React.FC<CaseFolderSectionProps> = ({
  selectedCase,
  folderName,
  sectionOptions = [],
  renameFileWithSection = false,
  title,
  allowUpload = true,
  allowDelete = true,
  uploadDisabled = false,
  deleteDisabled = false,
  bannerMessage,
  forceArchivedView = false,
  onUploadSuccess,
  onDeleteSuccess,
  onUploadingChange,
  onCreateDocument,
}) => {
  const apiBaseUrl = resolveApiBaseUrl();
  const currentUser = AuthMemory.getUser();
  const token = AuthMemory.getToken();

  const mutationHeaders: HeadersInit = useMemo(() => {
    const headers: HeadersInit = {
      Accept: "application/json",
      "X-User-Role": currentUser?.role || "",
      "X-User-FirmID": currentUser?.firmID || "",
    };

    if (token) {
      (headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }

    return headers;
  }, [currentUser?.firmID, currentUser?.role, token]);

  type DisplayFile = {
    id?: string;
    fileName: string;
    encrypted: boolean;
    category?: string;
    modifiedAt?: string;
    mimeType?: string;
    previewUrl?: string;
    downloadUrl?: string;
    deleteUrl?: string;
  };

  type FileSortMode = "modified_desc" | "modified_asc" | "name_asc" | "name_desc";

  const [files, setFiles] = useState<DisplayFile[]>([]);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [uploadSection, setUploadSection] = useState<string>(sectionOptions[0] || "");
  const [paidAmount, setPaidAmount] = useState<string>("");
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [bulkAction, setBulkAction] = useState<"download" | "delete" | null>(null);
  const [deleteRequest, setDeleteRequest] = useState<
    | { kind: "single"; file: DisplayFile }
    | { kind: "bulk"; files: DisplayFile[] }
    | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateInvoiceData, setUpdateInvoiceData] = useState<any | null>(null);
  const [updatePaidAmountLoading, setUpdatePaidAmountLoading] = useState(false);
  const [updatePaidAmountValue, setUpdatePaidAmountValue] = useState<string>("");
  const [archivedActiveFileName, setArchivedActiveFileName] = useState<string | null>(null);
  const [archivedPreviewUrl, setArchivedPreviewUrl] = useState<string | null>(null);
  const [archivedPreviewLoading, setArchivedPreviewLoading] = useState(false);
  const [fileSortMode, setFileSortMode] = useState<FileSortMode>("modified_desc");
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const alertVariant = useMemo(() => {
    if (!successMessage) {
      return "success" as const;
    }

    const normalized = successMessage.toLowerCase();
    if (
      normalized.includes("failed") ||
      normalized.includes("invalid") ||
      normalized.includes("permission") ||
      normalized.includes("no case selected")
    ) {
      return "danger" as const;
    }

    return "success" as const;
  }, [successMessage]);

  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);

  const isInvoiceFolder = folderName === "invoices";
  const isAdmin = (currentUser?.role || "").toLowerCase() === "admin";
  const canMutateInvoiceFiles = !isInvoiceFolder || (isAdmin && (allowUpload || allowDelete));
  const isArchivedCase = (selectedCase?.status || "").toLowerCase() === "archived";
  const showArchivedView = isArchivedCase || forceArchivedView;

  const getEncryptedFilesFromCase = useCallback((): DisplayFile[] => {
    const encrypted = selectedCase?.encrypted_documents ?? [];
    return encrypted
      .filter((item: EncryptedDocumentItem) => item.category === folderName && item.status !== "deleted")
      .map((item: EncryptedDocumentItem) => ({
        id: item.document_id,
        fileName: item.file_name,
        encrypted: item.is_encrypted ?? true,
        category: item.category,
        modifiedAt: (item as any).updated_at || item.created_at,
        mimeType: item.mime_type,
        previewUrl: item.preview_url,
        downloadUrl: item.download_url,
        deleteUrl: item.delete_url,
      }));
  }, [folderName, selectedCase?.encrypted_documents]);

  const getActionKey = useCallback((action: "preview" | "download" | "delete", file: DisplayFile) => {
    return `${action}:${file.id || file.fileName}`;
  }, []);

  const selectedFileItems = useMemo(
    () => files.filter((file) => selectedFiles.includes(file.fileName)),
    [files, selectedFiles]
  );

  const sortedFiles = useMemo(() => {
    const toMillis = (value?: string) => {
      if (!value) return 0;
      const millis = new Date(value).getTime();
      return Number.isFinite(millis) ? millis : 0;
    };

    return [...files].sort((a, b) => {
      const aName = String(a.fileName || "").toLowerCase();
      const bName = String(b.fileName || "").toLowerCase();
      const aModified = toMillis(a.modifiedAt);
      const bModified = toMillis(b.modifiedAt);

      switch (fileSortMode) {
        case "modified_asc":
          return aModified - bModified || aName.localeCompare(bName);
        case "name_asc":
          return aName.localeCompare(bName) || bModified - aModified;
        case "name_desc":
          return bName.localeCompare(aName) || bModified - aModified;
        case "modified_desc":
        default:
          return bModified - aModified || aName.localeCompare(bName);
      }
    });
  }, [fileSortMode, files]);

  const sortLabel = useMemo(() => {
    switch (fileSortMode) {
      case "modified_asc":
        return "Oldest Modified";
      case "name_asc":
        return "Name A-Z";
      case "name_desc":
        return "Name Z-A";
      case "modified_desc":
      default:
        return "Latest Modified";
    }
  }, [fileSortMode]);

  /* ================= FETCH FILES ================= */
  const fetchFiles = useCallback(async () => {
    setLoadingFiles(true);

    const encryptedFiles = getEncryptedFilesFromCase();
    setFiles(encryptedFiles);
    setLoadingFiles(false);
  }, [getEncryptedFilesFromCase]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  /* ================= UPLOAD ================= */
  const handleUpload = async (file: File) => {
    if (uploading) {
      return;
    }

    if (isInvoiceFolder && !canMutateInvoiceFiles) {
      setSuccessMessage("You do not have permission to upload invoice files.");
      return;
    }

    if (uploadDisabled || showArchivedView) {
      setSuccessMessage("This case is archived. Only admin can upload files.");
      return;
    }

    if (!selectedCase?.blob_folder_path) {
      setSuccessMessage("No case selected");
      return;
    }

    let finalFile = file;
    if (renameFileWithSection && uploadSection) {
      const extension = file.name.split(".").pop();
      const renamedFile = `${uploadSection}-${folderName}.${extension}`;
      finalFile = new File([file], renamedFile, { type: file.type });
    }

    const formData = new FormData();
    formData.append("file", finalFile);
    formData.append("case_id", String(selectedCase.caseId || ""));
    formData.append("category", folderName);
    if (isInvoiceFolder) {
      formData.append("invoice_stage", uploadSection || "initial");
      formData.append("paid_amount", paidAmount === "" ? "0" : paidAmount);
    }

    setUploading(true);

    try {
      await axiosUser.post(`/encrypted-documents/upload`,
        formData,
        { headers: mutationHeaders as Record<string, string> }
      );
      setSuccessMessage(`File "${finalFile.name}" uploaded successfully!`);
      if (isInvoiceFolder) {
        setPaidAmount("");
      }
      // Call the callback to refresh case data in parent component
      if (onUploadSuccess) {
        onUploadSuccess();
      }
      fetchFiles();
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.response?.data?.error || err?.message;
      setSuccessMessage(`Upload failed: ${message}`);
    } finally {
      setUploading(false);
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = async (file: DisplayFile) => {
    if (isInvoiceFolder && !canMutateInvoiceFiles) {
      setSuccessMessage("You do not have permission to delete invoice files.");
      return;
    }

    if (deleteDisabled || showArchivedView) {
      setSuccessMessage("This case is archived. Only admin can delete files.");
      return;
    }

    if (!file.fileName || file.fileName.endsWith("/")) {
      setSuccessMessage("Invalid file selected for deletion.");
      return;
    }

    setDeleteRequest({ kind: "single", file });
  };

  const getFileUrl = useCallback(async (endpoint: string): Promise<string> => {
    const res = await axiosUser.get(`${endpoint}`, {
      responseType: "blob",
      headers: mutationHeaders as Record<string, string>,
    });

    return URL.createObjectURL(res.data);
  }, [mutationHeaders]);

  const handlePreview = async (file: DisplayFile) => {
    const actionKey = getActionKey("preview", file);
    setLoadingAction(actionKey);

    try {
      if (previewFile) {
        URL.revokeObjectURL(previewFile);
      }

      if (file.encrypted && file.id) {
        const objectUrl = await getFileUrl(`/encrypted-documents/${file.id}/preview`);
        setPreviewFile(objectUrl);
        return;
      }

      setPreviewFile(`${apiBaseUrl}/read/${selectedCase?.blob_folder_path}${folderName}/${file.fileName}`);
    } catch (err: any) {
      setSuccessMessage(`Preview failed: ${err.message}`);
    } finally {
      setLoadingAction((current) => (current === actionKey ? null : current));
    }
  };

  const handleDownload = async (file: DisplayFile) => {
    const actionKey = getActionKey("download", file);
    setLoadingAction(actionKey);

    try {
      if (file.encrypted && file.id) {
        const objectUrl = await getFileUrl(`/encrypted-documents/${file.id}/download`);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = file.fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(objectUrl);
        return;
      }

      const a = document.createElement("a");
      a.href = `${apiBaseUrl}/read/${selectedCase?.blob_folder_path}${folderName}/${file.fileName}`;
      a.download = file.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      setSuccessMessage(`Download failed: ${err.message}`);
    } finally {
      setLoadingAction((current) => (current === actionKey ? null : current));
    }
  };

  const openArchivedPreview = useCallback(
    async (file: DisplayFile) => {
      setArchivedActiveFileName(file.fileName);
      setArchivedPreviewLoading(true);

      try {
        if (file.encrypted && file.id) {
          const objectUrl = await getFileUrl(`/encrypted-documents/${file.id}/preview`);
          setArchivedPreviewUrl((prev) => {
            if (prev?.startsWith("blob:")) {
              URL.revokeObjectURL(prev);
            }
            return objectUrl;
          });
        } else {
          const directUrl = `${apiBaseUrl}/read/${selectedCase?.blob_folder_path}${folderName}/${file.fileName}`;
          setArchivedPreviewUrl((prev) => {
            if (prev?.startsWith("blob:")) {
              URL.revokeObjectURL(prev);
            }
            return directUrl;
          });
        }
      } catch (err: any) {
        setArchivedPreviewUrl(null);
        setSuccessMessage(`Preview failed: ${err.message}`);
      } finally {
        setArchivedPreviewLoading(false);
      }
    },
    [apiBaseUrl, folderName, getFileUrl, selectedCase?.blob_folder_path]
  );

  useEffect(() => {
    if (!showArchivedView) {
      setArchivedPreviewUrl((prev) => {
        if (prev?.startsWith("blob:")) {
          URL.revokeObjectURL(prev);
        }
        return null;
      });
      setArchivedActiveFileName(null);
      return;
    }

    if (loadingFiles || archivedPreviewLoading || files.length === 0) {
      return;
    }

    const activeFile =
      files.find((item) => item.fileName === archivedActiveFileName) || files[0];

    if (archivedActiveFileName === activeFile.fileName && archivedPreviewUrl) {
      return;
    }

    void openArchivedPreview(activeFile);
  }, [
    showArchivedView,
    loadingFiles,
    archivedPreviewLoading,
    files,
    archivedActiveFileName,
    archivedPreviewUrl,
    openArchivedPreview,
  ]);

  useEffect(() => {
    return () => {
      if (archivedPreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(archivedPreviewUrl);
      }
    };
  }, [archivedPreviewUrl]);

  /* ================= SELECTION ================= */
  const toggleSelectionMode = () => {
    if (deleteDisabled) {
      setSuccessMessage("This case is archived. Selection for delete is disabled.");
      return;
    }

    setSelectionMode(!selectionMode);
    setSelectedFiles([]);
  };

  const toggleCheckbox = (file: string) => {
    setSelectedFiles((prev) =>
      prev.includes(file) ? prev.filter((f) => f !== file) : [...prev, file]
    );
  };

  const handleBulkDownload = async () => {
    if (selectedFileItems.length === 0) {
      setSuccessMessage("Please choose at least one file first.");
      return;
    }

    setBulkAction("download");
    try {
      for (const file of selectedFileItems) {
        await handleDownload(file);
      }
    } finally {
      setBulkAction(null);
    }
  };

  const handleBulkDelete = () => {
    if (isInvoiceFolder && !canMutateInvoiceFiles) {
      setSuccessMessage("You do not have permission to delete invoice files.");
      return;
    }

    if (deleteDisabled || showArchivedView) {
      setSuccessMessage("This case is archived. Only admin can delete files.");
      return;
    }

    if (selectedFileItems.length === 0) {
      setSuccessMessage("Please choose at least one file first.");
      return;
    }

    setDeleteRequest({ kind: "bulk", files: selectedFileItems });
  };

  const executeDeleteRequest = async () => {
    if (!deleteRequest) {
      return;
    }

    setIsDeleting(true);

    try {
      if (deleteRequest.kind === "single") {
        const file = deleteRequest.file;
        const actionKey = getActionKey("delete", file);
        setLoadingAction(actionKey);

        try {
          if (file.encrypted && file.id) {
            await axiosUser.delete(`/encrypted-documents/${file.id}`, {
              headers: mutationHeaders as Record<string, string>,
            });
          } else if (!file.encrypted) {
            const filePath = `${selectedCase?.blob_folder_path}${folderName}/${file.fileName}`;
            await axiosUser.delete(`/delete/${filePath}`, {
              headers: mutationHeaders as Record<string, string>,
            });
          }

          setSuccessMessage(`File "${file.fileName}" deleted successfully!`);
          if (isInvoiceFolder && onDeleteSuccess) {
            onDeleteSuccess();
          }
          fetchFiles();
        } catch (err: any) {
          const message = err?.response?.data?.message || err?.response?.data?.error || err?.message;
          setSuccessMessage(`Delete failed: ${message}`);
        } finally {
          setLoadingAction((current) => (current === actionKey ? null : current));
        }
      } else {
        const filesToDelete = deleteRequest.files;
        setBulkAction("delete");

        try {
          for (const file of filesToDelete) {
            if (file.encrypted && file.id) {
              await axiosUser.delete(`/encrypted-documents/${file.id}`, {
                headers: mutationHeaders as Record<string, string>,
              });
            } else {
              const folderPath = `${selectedCase?.blob_folder_path}${folderName}`.replace(/\/+$/, "");
              const filePath = `${folderPath}/${file.fileName}`;
              await axiosUser.delete(`/files?path=${encodeURIComponent(filePath)}`, {
                headers: mutationHeaders as Record<string, string>,
              });
            }
          }

          setSuccessMessage(`${filesToDelete.length} file(s) deleted successfully!`);
          setSelectedFiles([]);
          if (isInvoiceFolder && onDeleteSuccess) {
            onDeleteSuccess();
          }
          fetchFiles();
        } catch (err: any) {
          const message = err?.response?.data?.message || err?.response?.data?.error || err?.message;
          setSuccessMessage(`Delete failed: ${message}`);
        } finally {
          setBulkAction(null);
        }
      }
    } finally {
      setIsDeleting(false);
      setDeleteRequest(null);
    }
  };

  /* ================= RENDER FILE ================= */
  return (
    <>
      {bannerMessage && (
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
          {bannerMessage}
        </div>
      )}

      {/* Alert */}
      {successMessage && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(92vw, 600px)",
            zIndex: 2000,
          }}
        >
          <Alert variant={alertVariant} onClose={() => setSuccessMessage(null)} dismissible>
            {successMessage}
          </Alert>
        </div>
      )}

      {/* Header */}
      <div className="admin-billing-files-header">
        <h2 className="admin-billing-files-title">{title}</h2>
        <div className="admin-billing-files-actions">
          {sectionOptions.length > 0 && (isInvoiceFolder || allowUpload) && (
            <DropdownButton
              id="dropdown-upload"
              title={
                isInvoiceFolder
                  ? uploadSection
                    ? `${canMutateInvoiceFiles ? "Upload to" : "Phase"} ${formatStageLabel(uploadSection)}`
                    : canMutateInvoiceFiles
                      ? "Select upload phase"
                      : "Phase progression"
                  : `Upload to ${uploadSection.toUpperCase()}`
              }
              variant="warning"
              disabled={uploadDisabled || (isInvoiceFolder && !canMutateInvoiceFiles)}
              onSelect={(key) => {
                if (key === "__cancel_upload__") {
                  setUploadSection(sectionOptions[0] || "");
                  setPaidAmount("");
                  return;
                }

                setUploadSection(key || sectionOptions[0]);
              }}
            >
              {sectionOptions.map((section) => (
                <Dropdown.Item key={section} eventKey={section}>
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </Dropdown.Item>
              ))}
              {isInvoiceFolder && canMutateInvoiceFiles && (
                <>
                  <Dropdown.Divider />
                  <Dropdown.Item eventKey="__cancel_upload__" className="text-danger">
                    Cancel Upload Selection
                  </Dropdown.Item>
                </>
              )}
            </DropdownButton>
          )}

          {allowUpload && (!isInvoiceFolder || canMutateInvoiceFiles) && (
            <>
              <button
                type="button"
                className="admin-billing-file-btn admin-billing-file-btn-preview"
                disabled={uploadDisabled || uploading}
                onClick={() => uploadInputRef.current?.click()}
              >
                {uploading ? (
                  <>
                    <LoadingSpinner size={14} color="#ffffff" />
                    Uploading...
                  </>
                ) : (
                  "Upload File"
                )}
              </button>

              <input
                ref={uploadInputRef}
                type="file"
                accept="application/pdf"
                style={{ display: "none" }}
                disabled={uploadDisabled || uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    void handleUpload(file);
                  }
                  e.currentTarget.value = "";
                }}
              />
            </>
          )}

          {allowDelete && (!isInvoiceFolder || canMutateInvoiceFiles) && (
            <>
              <button
                type="button"
                className="admin-billing-file-btn admin-billing-file-btn-delete"
                onClick={() => onCreateDocument?.(folderName)}
              >
                Create
              </button>

              <button
                type="button"
                className="admin-billing-file-btn admin-billing-file-btn-download"
                disabled={deleteDisabled}
                onClick={toggleSelectionMode}
              >
                Select
              </button>

            </>
          )}

          <Dropdown>
            <Dropdown.Toggle className="admin-billing-file-btn admin-billing-file-btn-download" variant="secondary" id={`${folderName}-sort-dropdown`}>
              Sort: {sortLabel}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => setFileSortMode("modified_desc")}>Latest Modified</Dropdown.Item>
              <Dropdown.Item onClick={() => setFileSortMode("modified_asc")}>Oldest Modified</Dropdown.Item>
              <Dropdown.Item onClick={() => setFileSortMode("name_asc")}>Name A-Z</Dropdown.Item>
              <Dropdown.Item onClick={() => setFileSortMode("name_desc")}>Name Z-A</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      {selectionMode && allowDelete && (!isInvoiceFolder || canMutateInvoiceFiles) && (
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <button
            type="button"
            className="admin-billing-file-btn admin-billing-file-btn-download"
            style={{ opacity: selectedFileItems.length === 0 || bulkAction !== null ? 0.6 : 1, cursor: selectedFileItems.length === 0 || bulkAction !== null ? "not-allowed" : "pointer" }}
            disabled={selectedFileItems.length === 0 || bulkAction !== null}
            onClick={() => void handleBulkDownload()}
          >
            {bulkAction === "download" ? (
              <>
                <LoadingSpinner size={14} color="#ffffff" />
                Downloading...
              </>
            ) : (
              `Download Selected (${selectedFileItems.length})`
            )}
          </button>

          <button
            type="button"
            className="admin-billing-file-btn admin-billing-file-btn-delete"
            style={{ opacity: selectedFileItems.length === 0 || bulkAction !== null ? 0.6 : 1, cursor: selectedFileItems.length === 0 || bulkAction !== null ? "not-allowed" : "pointer" }}
            disabled={selectedFileItems.length === 0 || bulkAction !== null}
            onClick={() => void handleBulkDelete()}
          >
            {bulkAction === "delete" ? (
              <>
                <LoadingSpinner size={14} color="#ffffff" />
                Deleting...
              </>
            ) : (
              `Delete Selected (${selectedFileItems.length})`
            )}
          </button>
        </div>
      )}

      {isInvoiceFolder && (
        <InvoicePhaseSummary
          expectedPaymentPhases={selectedCase?.expected_payment_phases || null}
          invoicePaymentPhases={selectedCase?.invoice_payment_phases || null}
          selectedStage={uploadSection || sectionOptions[0] || "initial"}
          accentColor={colors.red}
          caseTypeFeeJson={selectedCase?.case_type_fee_json || null}
          encryptedDocuments={selectedCase?.encrypted_documents || null}
        />
      )}

      {isInvoiceFolder && allowUpload && canMutateInvoiceFiles && (
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Paid Amount (optional)"
            value={paidAmount}
            disabled={uploadDisabled}
            onChange={(e) => setPaidAmount(e.target.value)}
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: "8px",
              border: "1px solid #ccc",
              minWidth: "200px",
              opacity: uploadDisabled ? 0.7 : 1,
            }}
          />
        </div>
      )}

      <hr className="admin-billing-files-divider" />

      {/* File List */}
      {!loadingFiles && (
        <>
          {!showArchivedView && (
            <ul className="admin-billing-file-list">
              {sortedFiles.length === 0 && <p className="admin-billing-empty-list">No files found</p>}
              {sortedFiles.map((file, idx) => (
                <li key={idx} className="admin-billing-file-row">
                  <div className="admin-billing-file-main">
                    <strong className="admin-billing-file-name">{file.fileName}</strong>
                    {file.encrypted && (
                      <span className="admin-billing-file-badge-encrypted">ENCRYPTED</span>
                    )}
                  </div>
                  <div className="admin-billing-file-actions">
                    {!selectionMode && (
                      <>
                        <button
                          type="button"
                          disabled={loadingAction === getActionKey("preview", file)}
                          className="admin-billing-file-btn admin-billing-file-btn-preview"
                          style={{ cursor: loadingAction === getActionKey("preview", file) ? "not-allowed" : "pointer" }}
                          onClick={() => handlePreview(file)}
                        >
                          {loadingAction === getActionKey("preview", file) ? (
                            <>
                              <LoadingSpinner size={14} color="#ffffff" />
                              Previewing
                            </>
                          ) : (
                            "Preview"
                          )}
                        </button>

                        <button
                          type="button"
                          disabled={loadingAction === getActionKey("download", file)}
                          className="admin-billing-file-btn admin-billing-file-btn-download"
                          style={{ cursor: loadingAction === getActionKey("download", file) ? "not-allowed" : "pointer" }}
                          onClick={() => handleDownload(file)}
                        >
                          {loadingAction === getActionKey("download", file) ? (
                            <>
                              <LoadingSpinner size={14} color="#ffffff" />
                              Downloading
                            </>
                          ) : (
                            "Download"
                          )}
                        </button>

                        {allowDelete && (
                            <button
                              type="button"
                              disabled={deleteDisabled || loadingAction === getActionKey("delete", file)}
                              className="admin-billing-file-btn admin-billing-file-btn-delete"
                              style={{ opacity: deleteDisabled || loadingAction === getActionKey("delete", file) ? 0.6 : 1, cursor: deleteDisabled || loadingAction === getActionKey("delete", file) ? "not-allowed" : "pointer" }}
                              onClick={() => handleDelete(file)}
                            >
                              {loadingAction === getActionKey("delete", file) ? (
                                <>
                                  <LoadingSpinner size={14} color="#ffffff" />
                                  Deleting
                                </>
                              ) : (
                                "Delete"
                              )}
                            </button>
                        )}
                      </>
                    )}

                    {allowDelete && (!isInvoiceFolder || canMutateInvoiceFiles) && selectionMode && (
                      <label className="admin-billing-file-select">
                        <input
                          type="checkbox"
                          checked={selectedFiles.includes(file.fileName)}
                          onChange={() => toggleCheckbox(file.fileName)}
                        />
                        Choose
                      </label>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

        {/* Invoice Update Modal */}
        {showUpdateModal && updateInvoiceData && (() => {
          const inv = updateInvoiceData;
          const newPaid = Number(updatePaidAmountValue || 0);
          const expected = Number(inv.expected_amount || 0);
          const taxPct = Number(inv.tax || 0);
          const discountPct = Number(inv.discount || 0);
          const newBalance = Math.max(expected - newPaid, 0);
          const taxAmt = (newPaid * taxPct) / 100;
          const discountAmt = (newPaid * discountPct) / 100;
          const newTotal = newPaid + taxAmt - discountAmt;
          const fmt = (v: number) =>
            new Intl.NumberFormat('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

          const handleSubmit = async () => {
            setUpdatePaidAmountLoading(true);
            try {
              await axiosUser.post(`/invoices/${inv.id}/update-paid`,
                { paid_amount: newPaid, balance: newBalance, total_amount: newTotal },
                { headers: mutationHeaders as Record<string, string> }
              );
              setShowUpdateModal(false);
              setUpdateInvoiceData(null);
              setUpdatePaidAmountValue("");
              fetchFiles?.();
              onUploadSuccess?.();
            } catch (err) {
              console.error('Failed to update invoice', err);
            } finally {
              setUpdatePaidAmountLoading(false);
            }
          };

          return (
            <div
              style={{
                position: 'fixed', inset: 0, zIndex: 3000,
                background: 'rgba(0,0,0,0.55)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '1rem',
              }}
              onClick={() => { if (!updatePaidAmountLoading) setShowUpdateModal(false); }}
            >
              <div
                style={{
                  background: '#fff', borderRadius: '14px',
                  width: 'min(96vw, 560px)', maxHeight: '90vh', overflowY: 'auto',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.22)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '1rem 1.25rem 0.75rem',
                  borderBottom: `3px solid ${colors.red}`,
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: colors.red }}>INVOICE</div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.15rem' }}>
                      Update paid amount — all other fields are read-only
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { if (!updatePaidAmountLoading) setShowUpdateModal(false); }}
                    style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b', lineHeight: 1 }}
                  >×</button>
                </div>

                {/* Body */}
                <div style={{ padding: '1rem 1.25rem' }}>
                  {/* Invoice meta grid */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1rem',
                    background: '#f8fafc', borderRadius: '10px', padding: '0.85rem 1rem',
                    marginBottom: '1rem', fontSize: '0.9rem',
                  }}>
                    <div><span style={{ color: '#64748b' }}>Invoice No.</span><br /><strong>{inv.invoice_number || '—'}</strong></div>
                    <div><span style={{ color: '#64748b' }}>Payment Stage</span><br /><strong style={{ textTransform: 'capitalize' }}>{inv.payment_stage || '—'}</strong></div>
                    <div><span style={{ color: '#64748b' }}>Client</span><br /><strong>{inv.client_name || '—'}</strong></div>
                    <div><span style={{ color: '#64748b' }}>Case</span><br /><strong>{inv.case_title || '—'}</strong></div>
                    <div><span style={{ color: '#64748b' }}>Issue Date</span><br /><strong>{inv.issue_date || '—'}</strong></div>
                    <div><span style={{ color: '#64748b' }}>Due Date</span><br /><strong>{inv.due_date || '—'}</strong></div>
                  </div>

                  {/* Amounts table */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '1rem' }}>
                    {([
                      { label: 'Expected Amount', value: `RM ${fmt(expected)}` },
                      { label: 'Tax', value: `${taxPct}%` },
                      { label: 'Discount', value: `${discountPct}%` },
                    ] as { label: string; value: string }[]).map(({ label, value }) => (
                      <div key={label} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '0.6rem 1rem', borderBottom: '1px solid #f1f5f9',
                        fontSize: '0.9rem', color: '#64748b',
                      }}>
                        <span>{label}</span>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{value}</span>
                      </div>
                    ))}

                    {/* Editable paid amount */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.65rem 1rem', borderBottom: '1px solid #f1f5f9',
                      background: '#fffbeb',
                    }}>
                      <label htmlFor="update-paid-input" style={{ fontWeight: 600, color: '#92400e', fontSize: '0.9rem' }}>
                        Paid Amount (RM)
                      </label>
                      <input
                        id="update-paid-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={updatePaidAmountValue}
                        onChange={(e) => setUpdatePaidAmountValue(e.target.value)}
                        style={{
                          width: '140px', padding: '0.4rem 0.65rem',
                          borderRadius: '7px', border: `2px solid ${colors.red}`,
                          fontSize: '0.95rem', fontWeight: 700, textAlign: 'right',
                        }}
                        disabled={updatePaidAmountLoading}
                        autoFocus
                      />
                    </div>

                    {/* Balance */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.6rem 1rem', borderBottom: '1px solid #f1f5f9',
                      fontSize: '0.9rem', background: '#f0fdf4',
                    }}>
                      <span style={{ color: '#15803d', fontWeight: 600 }}>Balance</span>
                      <span style={{ fontWeight: 700, color: '#15803d' }}>RM {fmt(newBalance)}</span>
                    </div>

                    {/* Total */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.7rem 1rem', background: '#fff7ed', fontSize: '1rem',
                    }}>
                      <span style={{ fontWeight: 700, color: '#7c3aed' }}>Total Amount</span>
                      <span style={{ fontWeight: 800, color: '#7c3aed' }}>RM {fmt(newTotal)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setShowUpdateModal(false)}
                      disabled={updatePaidAmountLoading}
                      style={{
                        padding: '0.55rem 1.2rem', borderRadius: '8px',
                        border: '1px solid #cbd5e1', background: '#fff',
                        cursor: updatePaidAmountLoading ? 'not-allowed' : 'pointer',
                        opacity: updatePaidAmountLoading ? 0.6 : 1, fontWeight: 600,
                      }}
                    >Cancel</button>
                    <button
                      type="button"
                      onClick={() => void handleSubmit()}
                      disabled={updatePaidAmountLoading}
                      style={{
                        padding: '0.55rem 1.4rem', borderRadius: '8px',
                        background: colors.red, color: '#fff', border: 'none',
                        cursor: updatePaidAmountLoading ? 'not-allowed' : 'pointer',
                        opacity: updatePaidAmountLoading ? 0.7 : 1,
                        fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem',
                      }}
                    >
                      {updatePaidAmountLoading
                        ? <><LoadingSpinner size={14} color="#fff" /> Updating...</>
                        : 'Update'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

          {showArchivedView && files.length === 0 && (
            <p style={{ color: "#475569" }}>No files found</p>
          )}

          {showArchivedView && files.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {files.map((file) => {
                  const active = archivedActiveFileName === file.fileName;
                  return (
                    <button
                      key={`${file.id || "legacy"}-${file.fileName}`}
                      type="button"
                      onClick={() => void openArchivedPreview(file)}
                      style={{
                        border: `1px solid ${active ? colors.red : "#cbd5e1"}`,
                        background: active ? "#fff1f2" : "#f8fafc",
                        color: active ? colors.red : "#334155",
                        borderRadius: "999px",
                        padding: "0.38rem 0.8rem",
                        fontSize: "0.84rem",
                        whiteSpace: "nowrap",
                        fontWeight: active ? 700 : 600,
                        cursor: "pointer",
                      }}
                    >
                      {file.fileName}
                    </button>
                  );
                })}
              </div>

              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  background: "#fff",
                  minHeight: "68vh",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {archivedPreviewLoading && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "grid",
                      placeItems: "center",
                      gap: "0.6rem",
                      background: "rgba(255, 255, 255, 0.88)",
                      zIndex: 1,
                    }}
                  >
                    <LoadingSpinner size={40} color={colors.red} />
                    <span style={{ color: "#475569", fontWeight: 600 }}>Loading preview...</span>
                  </div>
                )}

                {archivedPreviewUrl ? (
                  <iframe
                    src={archivedPreviewUrl}
                    style={{ width: "100%", height: "68vh", border: "none" }}
                    title="Archived document preview"
                  />
                ) : (
                  !archivedPreviewLoading && (
                    <div
                      style={{
                        height: "68vh",
                        display: "grid",
                        placeItems: "center",
                        color: "#64748b",
                      }}
                    >
                      Preview not available for this document.
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmModal
        show={deleteRequest !== null}
        title={deleteRequest?.kind === "bulk" ? "Delete Selected Files" : "Delete File"}
        confirmText="Delete"
        confirmingText="Deleting..."
        isConfirming={isDeleting}
        onConfirm={() => void executeDeleteRequest()}
        onCancel={() => setDeleteRequest(null)}
      >
        {deleteRequest?.kind === "single" ? (
          <p style={{ marginBottom: 0 }}>
            Are you sure you want to delete "{deleteRequest.file.fileName}"? This action cannot be undone.
          </p>
        ) : deleteRequest?.kind === "bulk" ? (
          <p style={{ marginBottom: 0 }}>
            Are you sure you want to delete {deleteRequest.files.length} selected file(s)? This action cannot be undone.
          </p>
        ) : null}
      </ConfirmModal>

      {/* Preview Modal */}
      {previewFile && (
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
          onClick={() => {
            if (previewFile?.startsWith("blob:")) {
              URL.revokeObjectURL(previewFile);
            }
            setPreviewFile(null);
          }}
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
            <button
              type="button"
              onClick={() => {
                if (previewFile?.startsWith("blob:")) {
                  URL.revokeObjectURL(previewFile);
                }
                setPreviewFile(null);
              }}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "#c23b4d",
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "0.5rem 1rem",
                cursor: "pointer",
                zIndex: 10,
              }}
            >
              Close
            </button>

            <iframe
              src={previewFile}
              style={{ width: "100%", height: "100%", border: "none" }}
              title="Preview"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default CaseFolderSection;
