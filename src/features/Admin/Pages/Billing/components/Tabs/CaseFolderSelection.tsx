import React, { useState, useEffect, useCallback } from "react";
import { colors } from "../../../../../../constant/color";
import Alert from "react-bootstrap/Alert";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import SelectToggleButton from "../Select Files/select";
import AuthMemory from "../../../../../../data/authMemory";
import axiosUser from "../../../../../../api/axiosUser";

interface CaseInfo {
  lawyerFirmID: string;
  clientFirmID?: string;
  caseId?: string;
  blob_folder_path?: string;
}

interface CaseFolderSectionProps {
  selectedCase?: CaseInfo;
  folderName: string; // e.g., "documents" or "cheques"
  sectionOptions?: string[]; // optional section dropdown
  renameFileWithSection?: boolean; // if true, adds section prefix on upload
  title: string; // Header title
}

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

  const [files, setFiles] = useState<string[]>([]);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [uploadSection, setUploadSection] = useState<string>(sectionOptions[0] || "");

  /* ================= FETCH FILES ================= */
  const fetchFiles = useCallback(async () => {
    if (!selectedCase?.blob_folder_path) return;

    try {
      const folderPath = `${selectedCase.blob_folder_path}${folderName}/`;
      const response = await axiosUser.get(
        `${process.env.REACT_APP_API_URL}/files?folder=${encodeURIComponent(folderPath)}`,
        { headers: mutationHeaders as Record<string, string> }
      );
      const data = response.data;
      const rawFiles: unknown[] = Array.isArray(data.files) ? data.files : [];
      const visibleFiles = rawFiles.filter((file): file is string => {
        if (typeof file !== "string") {
          return false;
        }

        const normalized = file.toLowerCase();
        return !normalized.startsWith("encrypted/") && !normalized.includes("/encrypted/");
      });

      setFiles(visibleFiles);
    } catch (err) {
      console.error(`Failed to fetch ${folderName}:`, err);
    }
  }, [selectedCase?.blob_folder_path, folderName]);

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
  const handleDelete = async (file: string) => {
    if (!selectedCase?.blob_folder_path) return;
    if (!window.confirm(`Delete "${file}"?`)) return;

    const filePath = `${selectedCase.blob_folder_path}${folderName}/${file}`;

    try {
      await axiosUser.delete(`${process.env.REACT_APP_API_URL}/delete/${filePath}`, {
        headers: mutationHeaders as Record<string, string>,
      });

      setSuccessMessage(`File "${file}" deleted successfully!`);
      fetchFiles();
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.response?.data?.error || err?.message;
      setSuccessMessage(`Delete failed: ${message}`);
    }
  };

  /* ================= SELECTION ================= */
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedFiles([]);
  };

  const toggleCheckbox = (file: string) => {
    setSelectedFiles((prev) =>
      prev.includes(file) ? prev.filter((f) => f !== file) : [...prev, file]
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
          <li key={idx} style={{ marginBottom: "1.5rem" }}>
            <strong>{file}</strong>
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
                    onClick={() =>
                      setPreviewFile(`${process.env.REACT_APP_API_URL}/read/${selectedCase?.blob_folder_path}${folderName}/${file}`)
                    }
                  >
                    Preview
                  </button>
                  <a
                    href={`${process.env.REACT_APP_API_URL}/read/${selectedCase?.blob_folder_path}${folderName}/${file}`}
                    download
                    style={{
                      background: colors.red1,
                      color: "white",
                      borderRadius: "8px",
                      padding: "0.5rem 1rem",
                      textDecoration: "none",
                    }}
                  >
                    Download
                  </a>
                  <button
                    style={{
                      background: colors.red,
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      padding: "0.5rem 1rem",
                    }}
                    onClick={() => handleDelete(file)}
                  >
                    Delete
                  </button>
                </>
              )}

              {selectionMode && (
                <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(file)}
                    onChange={() => toggleCheckbox(file)}
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
          onClick={() => setPreviewFile(null)}
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
              onClick={() => setPreviewFile(null)}
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