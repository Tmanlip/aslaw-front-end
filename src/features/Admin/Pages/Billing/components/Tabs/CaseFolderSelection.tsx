import React, { useState, useEffect, useCallback } from "react";
import { colors } from "../../../../../../constant/color";
import Alert from "react-bootstrap/Alert";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import SelectToggleButton from "../Select Files/select";
import AuthMemory from "../../../../../../data/authMemory";
import axiosUser from "../../../../../../api/axiosUser";
import { EncryptedDocumentItem } from "../../../../../../data/userInfo";

interface CaseInfo {
  lawyerFirmID: string;
  clientFirmID?: string;
  id?: number;
  caseId?: string;
  blob_folder_path?: string;
  encrypted_documents?: EncryptedDocumentItem[];
}

interface CaseFolderSectionProps {
  selectedCase?: CaseInfo;
  folderName: string; // e.g., "documents" or "cheques"
  sectionOptions?: string[]; // optional section dropdown
  renameFileWithSection?: boolean; // if true, adds section prefix on upload
  title: string; // Header title
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

const CaseFolderSection: React.FC<CaseFolderSectionProps> = ({
  selectedCase,
  folderName,
  sectionOptions = [],
  renameFileWithSection = false,
  title,
}) => {
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
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [uploadSection, setUploadSection] = useState<string>(sectionOptions[0] || "");

  const getLegacyFilePath = useCallback(
    (fileName: string) => `${selectedCase?.blob_folder_path ?? ""}${folderName}/${fileName}`,
    [selectedCase?.blob_folder_path, folderName]
  );

  const getPreviewUrl = useCallback(
    (file: DisplayFile): string | null => {
      if (file.encrypted && file.id) {
        return `${process.env.REACT_APP_API_URL}/encrypted-documents/${file.id}/preview`;
      }

      const legacyPath = getLegacyFilePath(file.fileName);
      if (!legacyPath) {
        return null;
      }

      return `${process.env.REACT_APP_API_URL}/read/${encodeURI(legacyPath)}`;
    },
    [getLegacyFilePath]
  );

  const getDownloadUrl = useCallback(
    (file: DisplayFile): string | null => {
      if (file.encrypted && file.id) {
        return `${process.env.REACT_APP_API_URL}/encrypted-documents/${file.id}/download`;
      }

      const legacyPath = getLegacyFilePath(file.fileName);
      if (!legacyPath) {
        return null;
      }

      return `${process.env.REACT_APP_API_URL}/download/${encodeURI(legacyPath)}`;
    },
    [getLegacyFilePath]
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
      .filter((item) => item.category === folderName && item.status !== "deleted")
      .map((item) => ({
        id: item.document_id,
        fileName: item.file_name,
        encrypted: true,
      }));
  };

  /* ================= FETCH FILES ================= */
  const fetchFiles = useCallback(async () => {
    // First, refresh encrypted docs for the selected case from backend.
    const selectedCaseId = Number(selectedCase?.caseId ?? selectedCase?.id);
    if (Number.isFinite(selectedCaseId) && selectedCaseId > 0) {
      try {
        const casesResponse = await axiosUser.get(`${process.env.REACT_APP_API_URL}/cases`, {
          headers: mutationHeaders as Record<string, string>,
        });

        const cases: CaseApiItem[] = Array.isArray(casesResponse.data) ? casesResponse.data : [];
        const matchedCase = cases.find((c) => Number(c.caseId ?? c.id) === selectedCaseId);
        const encryptedFiles = buildEncryptedDisplayFiles(matchedCase?.encrypted_documents ?? []);
        if (encryptedFiles.length > 0) {
          setFiles(encryptedFiles);
          return;
        }
      } catch (err) {
        console.error(`Failed to refresh encrypted ${folderName} for case ${selectedCaseId}:`, err);
      }
    } else {
      // Fallback to locally available case data.
      const encryptedFiles = buildEncryptedDisplayFiles(selectedCase?.encrypted_documents ?? []);
      if (encryptedFiles.length > 0) {
        setFiles(encryptedFiles);
        return;
      }
    }

    if (!selectedCase?.blob_folder_path) return;

    try {
      const folderPath = `${selectedCase.blob_folder_path}${folderName}/`;
      const response = await axiosUser.get(
        `${process.env.REACT_APP_API_URL}/files?folder=${encodeURIComponent(folderPath)}`,
        { headers: mutationHeaders as Record<string, string> }
      );
      const data = response.data;
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
      console.error(`Failed to fetch ${folderName}:`, err);
    }
  }, [selectedCase?.blob_folder_path, selectedCase?.caseId, selectedCase?.id, selectedCase?.encrypted_documents, folderName]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  /* ================= UPLOAD ================= */
  const handleUpload = async (file: File) => {
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
    formData.append("folder", `${selectedCase.blob_folder_path}${folderName}/`);
    formData.append("caseId", selectedCase.caseId || "");

    try {
      await axiosUser.post(`${process.env.REACT_APP_API_URL}/upload`, formData, {
        headers: mutationHeaders as Record<string, string>,
      });

      setSuccessMessage(`File "${finalFile.name}" uploaded successfully!`);
      fetchFiles();
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.response?.data?.error || err?.message;
      setSuccessMessage(`Upload failed: ${message}`);
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = async (file: DisplayFile) => {
    if (!selectedCase?.blob_folder_path && !file.encrypted) return;
    if (!window.confirm(`Delete "${file.fileName}"?`)) return;

    // For legacy files, use the blob delete endpoint
    if (!file.encrypted) {
      const filePath = `${selectedCase?.blob_folder_path}${folderName}/${file.fileName}`;
      try {
        await axiosUser.delete(`${process.env.REACT_APP_API_URL}/delete/${filePath}`, {
          headers: mutationHeaders as Record<string, string>,
        });

        setSuccessMessage(`File "${file.fileName}" deleted successfully!`);
        fetchFiles();
      } catch (err: any) {
        const message = err?.response?.data?.message || err?.response?.data?.error || err?.message;
        setSuccessMessage(`Delete failed: ${message}`);
      }
    }
  };

  /* ================= SELECTION ================= */
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedFiles([]);
  };

  const toggleCheckbox = (fileName: string) => {
    setSelectedFiles((prev) =>
      prev.includes(fileName) ? prev.filter((f) => f !== fileName) : [...prev, fileName]
    );
  };

  /* ================= RENDER FILE ================= */
  return (
    <>
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
          <Alert variant="success" onClose={() => setSuccessMessage(null)} dismissible>
            {successMessage}
          </Alert>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.25rem", gap: "0.75rem", flexWrap: "wrap" }}>
        <h2 style={{ margin: 0 }}>{title}</h2>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {sectionOptions.length > 0 && (
            <DropdownButton
              id="dropdown-upload"
              title={`Upload to ${uploadSection.toUpperCase()}`}
              variant="warning"
              onSelect={(key) => setUploadSection(key || sectionOptions[0])}
            >
              {sectionOptions.map((section) => (
                <Dropdown.Item key={section} eventKey={section}>
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </Dropdown.Item>
              ))}
            </DropdownButton>
          )}

          <label
            style={{
              padding: "0.5rem 1rem",
              background: colors.gold,
              color: "white",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Upload File
            <input
              type="file"
              accept="application/pdf"
              style={{ display: "none" }}
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            />
          </label>

          <SelectToggleButton selectionMode={selectionMode} onToggle={toggleSelectionMode} />
        </div>
      </div>

      <hr style={{ border: `2px solid ${colors.red}`, marginBottom: "1rem" }} />

      {/* File List */}
      <ul>
        {files.length === 0 && <p>No files found</p>}
        {files.map((file, idx) => (
          <li key={file.id || idx} style={{ marginBottom: "1.5rem" }}>
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
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
              {!selectionMode && (
                <>
                  <button
                    style={{
                      background: colors.gold,
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      padding: "0.5rem 1rem",
                    }}
                    onClick={() => openPreview(file)}
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => downloadFile(file)}
                    style={{
                      background: colors.red1,
                      color: "white",
                      borderRadius: "8px",
                      padding: "0.5rem 1rem",
                      border: "none",
                    }}
                  >
                    Download
                  </button>
                  <button
                    style={{
                      background: colors.red,
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      padding: "0.5rem 1rem",
                      opacity: file.encrypted ? 0.5 : 1,
                      cursor: file.encrypted ? "not-allowed" : "pointer",
                    }}
                    onClick={() => handleDelete(file)}
                    disabled={file.encrypted}
                  >
                    Delete
                  </button>
                </>
              )}

              {selectionMode && (
                <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
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