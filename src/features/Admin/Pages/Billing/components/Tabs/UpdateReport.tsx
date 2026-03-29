import React, { useEffect, useState, useCallback } from "react";
import { colors } from "../../../../../../constant/color";
import Alert from "react-bootstrap/Alert";
import CreateReportOffcanvas from "../OffCanvas/Reports";
import Form from "react-bootstrap/Form";
import SelectToggleButton from "../Select Files/select";
import AuthMemory from "../../../../../../data/authMemory";
import axiosUser from "../../../../../../api/axiosUser";
import { EncryptedDocumentItem } from "../../../../../../data/userInfo";

const API_URL = process.env.REACT_APP_API_URL;

interface CaseInfo {
  lawyerFirmID: string;
  clientFirmID?: string;
  caseId?: string;
  blob_folder_path?: string;
  encrypted_documents?: EncryptedDocumentItem[];
}

interface ReportsSectionProps {
  selectedCase?: CaseInfo;
}

type DisplayFile = {
  id?: string;
  fileName: string;
  encrypted: boolean;
};

type CaseApiItem = {
  id?: number;
  caseId?: number;
  encrypted_documents?: EncryptedDocumentItem[];
};

const ReportsSection: React.FC<ReportsSectionProps> = ({ selectedCase }) => {
  const currentUser = AuthMemory.getUser();
  const token = AuthMemory.getToken();

  const mutationHeaders: HeadersInit = {
    Accept: "application/json",
    "X-User-Role": currentUser?.role || "",
    "X-User-FirmID": currentUser?.firmID || "",
  };

  if (token) {
    (mutationHeaders as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  const [files, setFiles] = useState<DisplayFile[]>([]);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const getLegacyReportPath = useCallback(
    (fileName: string) => `${selectedCase?.blob_folder_path ?? ""}reports/${fileName}`,
    [selectedCase?.blob_folder_path]
  );

  const getPreviewUrl = useCallback(
    (file: DisplayFile): string | null => {
      if (file.encrypted && file.id) {
        return `${API_URL}/encrypted-documents/${file.id}/preview`;
      }

      const legacyPath = getLegacyReportPath(file.fileName);
      if (!legacyPath) {
        return null;
      }

      return `${API_URL}/read/${encodeURI(legacyPath)}`;
    },
    [getLegacyReportPath]
  );

  const getDownloadUrl = useCallback(
    (file: DisplayFile): string | null => {
      if (file.encrypted && file.id) {
        return `${API_URL}/encrypted-documents/${file.id}/download`;
      }

      const legacyPath = getLegacyReportPath(file.fileName);
      if (!legacyPath) {
        return null;
      }

      return `${API_URL}/download/${encodeURI(legacyPath)}`;
    },
    [getLegacyReportPath]
  );

  const openPreview = useCallback(
    async (file: DisplayFile) => {
      try {
        const url = getPreviewUrl(file);
        if (!url) {
          setSuccessMessage("Invalid file path for preview.");
          return;
        }

        const response = await axiosUser.get(url, {
          responseType: "blob",
          headers: mutationHeaders as Record<string, string>,
        });

        if (previewFile) {
          URL.revokeObjectURL(previewFile);
        }

        const objectUrl = URL.createObjectURL(response.data as Blob);
        setPreviewFile(objectUrl);
      } catch (err: any) {
        const message = err?.response?.data?.message || err?.response?.data?.error || err?.message;
        setSuccessMessage(`Preview failed: ${message}`);
      }
    },
    [getPreviewUrl, mutationHeaders, previewFile]
  );

  const downloadFile = useCallback(
    async (file: DisplayFile) => {
      try {
        const url = getDownloadUrl(file);
        if (!url) {
          setSuccessMessage("Invalid file path for download.");
          return;
        }

        const response = await axiosUser.get(url, {
          responseType: "blob",
          headers: mutationHeaders as Record<string, string>,
        });

        const objectUrl = URL.createObjectURL(response.data as Blob);
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = file.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
      } catch (err: any) {
        const message = err?.response?.data?.message || err?.response?.data?.error || err?.message;
        setSuccessMessage(`Download failed: ${message}`);
      }
    },
    [getDownloadUrl, mutationHeaders]
  );

  const buildEncryptedDisplayFiles = (encryptedDocs: EncryptedDocumentItem[] = []): DisplayFile[] => {
    return encryptedDocs
      .filter((item) => item.category === "reports" && item.status !== "deleted")
      .map((item) => ({
        id: item.document_id,
        fileName: item.file_name,
        encrypted: true,
      }));
  };

  // ✅ Fetch reports from Laravel (using axiosUser for consistency)
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);

      // First, refresh encrypted docs from backend for the selected case.
      const selectedCaseId = Number(selectedCase?.caseId);
      if (Number.isFinite(selectedCaseId) && selectedCaseId > 0) {
        const casesResponse = await axiosUser.get(`${API_URL}/cases`, {
          headers: mutationHeaders as Record<string, string>,
        });

        const cases: CaseApiItem[] = Array.isArray(casesResponse.data) ? casesResponse.data : [];
        const matchedCase = cases.find((c) => Number(c.caseId ?? c.id) === selectedCaseId);
        const encryptedFiles = buildEncryptedDisplayFiles(matchedCase?.encrypted_documents ?? []);
        if (encryptedFiles.length > 0) {
          setFiles(encryptedFiles);
          return;
        }
      } else {
        // Fallback to locally available case data if caseId is not present.
        const encryptedFiles = buildEncryptedDisplayFiles(selectedCase?.encrypted_documents ?? []);
        if (encryptedFiles.length > 0) {
          setFiles(encryptedFiles);
          return;
        }
      }

      // If no encrypted reports, fetch from Azure blob
      if (!selectedCase?.blob_folder_path) {
        setFiles([]);
        return;
      }

      const folderPath = `${selectedCase.blob_folder_path}reports/`;
      const response = await axiosUser.get(
        `${API_URL}/files?folder=${encodeURIComponent(folderPath)}`,
        {
          headers: mutationHeaders as Record<string, string>,
        }
      );

      const data = response.data;

      // ✅ Filter out encrypted folder items from legacy files
      const rawFiles: unknown[] = Array.isArray(data.files) ? data.files : [];
      const legacyFiles = rawFiles
        .filter((file): file is string => {
          if (typeof file !== "string") {
            return false;
          }

          const normalized = file.toLowerCase();
          return (
            !normalized.startsWith("encrypted/") &&
            !normalized.includes("/encrypted/")
          );
        })
        .map((fileName: string) => ({
          fileName,
          encrypted: false,
        }));

      setFiles(legacyFiles);
    } catch (err) {
      console.error("Failed to fetch reports", err);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCase?.blob_folder_path, selectedCase?.caseId, selectedCase?.encrypted_documents]);

  useEffect(() => {
    fetchReports();
  }, [selectedCase?.blob_folder_path, selectedCase?.caseId]);

  const toggleSelectionMode = () => {
    setSelectionMode((prev) => !prev);
    setSelectedFiles([]);
  };

  const toggleCheckbox = (file: string) => {
    setSelectedFiles((prev) =>
      prev.includes(file) ? prev.filter((f) => f !== file) : [...prev, file]
    );
  };

  return (
    <>
      {/* ✅ Success Alert */}
      {successMessage && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 2000,
            width: "min(92vw, 600px)",
          }}
        >
          <Alert
            variant="success"
            dismissible
            onClose={() => setSuccessMessage(null)}
          >
            {successMessage}
          </Alert>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "1.25rem",
          gap: "0.75rem",
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ margin: 0 }}>Reports</h2>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            style={{
              padding: "0.5rem 1rem",
              background: colors.red,
              color: "white",
              borderRadius: "8px",
              border: "none",
              fontWeight: "bold",
            }}
            onClick={() => setShowOffcanvas(true)}
          >
            Create
          </button>

          <SelectToggleButton
            selectionMode={selectionMode}
            onToggle={toggleSelectionMode}
          />
        </div>
      </div>

      <hr style={{ border: `2px solid ${colors.red}`, marginBottom: "1rem" }} />

      {/* Loading */}
      {loading && <p>Loading reports…</p>}

      {/* Empty state */}
      {!loading && files.length === 0 && (
        <p style={{ color: "#777" }}>No reports uploaded yet.</p>
      )}

      {/* Reports List */}
      <ul>
        {files.map((file, index) => (
          <li key={file.id || index} style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <strong>{file.fileName}</strong>
              {file.encrypted && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.25rem 0.5rem",
                    background: colors.gold,
                    color: "black",
                    borderRadius: "4px",
                    fontWeight: "bold",
                  }}
                >
                  ENCRYPTED
                </span>
              )}
            </div>

            <div
              style={{
                marginTop: "0.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              {!selectionMode && (
                <>
                  {/* ✅ PREVIEW */}
                  <button
                    style={{
                      marginRight: "1rem",
                      padding: "0.5rem 1rem",
                      background: colors.gold,
                      color: "white",
                      borderRadius: "8px",
                      border: "none",
                    }}
                    onClick={() => openPreview(file)}
                  >
                    Preview
                  </button>

                  {/* ✅ DOWNLOAD */}
                  <button
                    onClick={() => downloadFile(file)}
                    style={{
                      marginRight: "1rem",
                      padding: "0.5rem 1rem",
                      background: colors.red1,
                      color: "white",
                      borderRadius: "8px",
                      border: "none",
                    }}
                  >
                    Download
                  </button>
                </>
              )}

              {/* Selection mode */}
              {selectionMode && (
                <Form.Check
                  type="checkbox"
                  label="Choose"
                  checked={selectedFiles.includes(file.fileName)}
                  onChange={() => toggleCheckbox(file.fileName)}
                />
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* ✅ Preview Modal */}
      {previewFile && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => {
            if (previewFile) {
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
            <iframe
              src={previewFile}
              style={{ width: "100%", height: "100%", border: "none" }}
              title="PDF Preview"
            />

            <button
              onClick={() => {
                if (previewFile) {
                  URL.revokeObjectURL(previewFile);
                }
                setPreviewFile(null);
              }}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: colors.red,
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "0.5rem 1rem",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Offcanvas */}
      <CreateReportOffcanvas
        show={showOffcanvas}
        onHide={() => {
          setShowOffcanvas(false);
          fetchReports(); // ✅ refresh after create
        }}
      />
    </>
  );
};

export default ReportsSection;