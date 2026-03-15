// CaseFolderSection.tsx
import React, { useState, useEffect } from "react";
import { colors } from "../../../../../../constant/color";
import Alert from "react-bootstrap/Alert";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import SelectToggleButton from "../Select Files/select";
import { Case } from "../../../../../../data/userInfo";
import AuthMemory from "../../../../../../data/authMemory";

interface CaseFolderSectionProps {
  selectedCase?: Case;
  folderName: string; // e.g., "documents" or "cheques"
  sectionOptions?: string[]; // optional section dropdown
  renameFileWithSection?: boolean; // if true, adds section prefix on upload
  title: string; // Header title
  allowUpload?: boolean;
  allowDelete?: boolean;
  uploadDisabled?: boolean;
  deleteDisabled?: boolean;
}

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
  const fetchFiles = async () => {
    if (!selectedCase?.blob_folder_path) return;

    try {
      const folderPath = `${selectedCase.blob_folder_path}${folderName}/`;
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/files?folder=${encodeURIComponent(folderPath)}`,
        { method: "GET", headers: { Accept: "application/json" } }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || `Failed to fetch ${folderName}`);
      }
      setFiles(data.files || []);
      setSuccessMessage(null);
    } catch (err) {
      console.error(`Failed to fetch ${folderName}:`, err);
      setFiles([]);
      setSuccessMessage(
        `Failed to load ${folderName}: ${err instanceof Error ? err.message : "Unexpected error"}`
      );
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [selectedCase]);

  /* ================= UPLOAD ================= */
  const handleUpload = async (file: File) => {
    if (uploadDisabled) {
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
    formData.append("folder", `${selectedCase.blob_folder_path}${folderName}/`);
    formData.append("caseId", String(selectedCase.caseId || ""));

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/upload`, {
        method: "POST",
        body: formData,
        headers: mutationHeaders,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setSuccessMessage(`File "${finalFile.name}" uploaded successfully!`);
      fetchFiles();
    } catch (err: any) {
      setSuccessMessage(`Upload failed: ${err.message}`);
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = async (file: string) => {
    if (deleteDisabled) {
      setSuccessMessage("This case is archived. Only admin can delete files.");
      return;
    }

    if (!selectedCase?.blob_folder_path) return;
    if (!window.confirm(`Delete "${file}"?`)) return;
    if (!file || file.endsWith("/")) {
      setSuccessMessage("Invalid file selected for deletion.");
      return;
    }

    const folderPath = `${selectedCase.blob_folder_path}${folderName}`.replace(/\/+$/, "");
    const filePath = `${folderPath}/${file}`;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/files?path=${encodeURIComponent(filePath)}`,
        {
        method: "DELETE",
        headers: mutationHeaders,
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || data?.message || "Delete failed");
      setSuccessMessage(`File "${file}" deleted successfully!`);
      fetchFiles();
    } catch (err: any) {
      setSuccessMessage(`Delete failed: ${err.message}`);
    }
  };

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
            maxWidth: "600px",
            zIndex: 2000,
          }}
        >
          <Alert variant="success" onClose={() => setSuccessMessage(null)} dismissible>
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
          marginTop: "2rem",
        }}
      >
        <h2 style={{ margin: 0 }}>{title}</h2>
        <div style={{ display: "flex", gap: "1rem" }}>
          {allowUpload && sectionOptions.length > 0 && (
            <DropdownButton
              id="dropdown-upload"
              title={`Upload to ${uploadSection.toUpperCase()}`}
              variant="warning"
              disabled={uploadDisabled}
              onSelect={(key) => setUploadSection(key || sectionOptions[0])}
            >
              {sectionOptions.map((section) => (
                <Dropdown.Item key={section} eventKey={section}>
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </Dropdown.Item>
              ))}
            </DropdownButton>
          )}

          {allowUpload && (
            <label
              style={{
                padding: "0.5rem 1rem",
                background: colors.gold,
                color: "white",
                borderRadius: "8px",
                cursor: uploadDisabled ? "not-allowed" : "pointer",
                opacity: uploadDisabled ? 0.6 : 1,
                fontWeight: "bold",
              }}
            >
              Upload File
              <input
                type="file"
                accept="application/pdf"
                style={{ display: "none" }}
                disabled={uploadDisabled}
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
              />
            </label>
          )}

          {allowDelete && (
            <SelectToggleButton
              selectionMode={selectionMode}
              onToggle={toggleSelectionMode}
              disabled={deleteDisabled}
            />
          )}
        </div>
      </div>

      <hr style={{ border: `2px solid ${colors.red}`, marginBottom: "1rem" }} />

      {/* File List */}
      <ul>
        {files.length === 0 && <p>No files found</p>}
        {files.map((file, idx) => (
          <li key={idx} style={{ marginBottom: "1.5rem" }}>
            <strong>{file}</strong>
            <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
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
                      setPreviewFile(
                        `${process.env.REACT_APP_API_URL}/read/${selectedCase?.blob_folder_path}${folderName}/${file}`
                      )
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

                  {allowDelete && (
                    <button
                      style={{
                        background: colors.red,
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        padding: "0.5rem 1rem",
                        opacity: deleteDisabled ? 0.6 : 1,
                        cursor: deleteDisabled ? "not-allowed" : "pointer",
                      }}
                      disabled={deleteDisabled}
                      onClick={() => handleDelete(file)}
                    >
                      Delete
                    </button>
                  )}
                </>
              )}

              {allowDelete && selectionMode && (
                <label style={{ display: "flex", gap: "0.5rem" }}>
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
              width: "80%",
              height: "80%",
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