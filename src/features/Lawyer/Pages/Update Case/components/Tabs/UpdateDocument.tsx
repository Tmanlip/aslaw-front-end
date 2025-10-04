import React, { useState } from "react";
import { colors } from "../../../../../../constant/color";
import Alert from "react-bootstrap/Alert";
import CreateDocumentOffcanvas from "../OffCanvas/Documents";
import SelectToggleButton from "../Select Files/select"; // ⬅️ Import reusable button

interface DocumentsSectionProps {
  files: string[];
}

const DocumentsSection: React.FC<DocumentsSectionProps> = ({ files }) => {
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showOffcanvas, setShowOffcanvas] = useState(false);

  // ✅ Manage selection state here
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const toggleSelectionMode = () => {
    if (selectionMode) {
      setSelectionMode(false);
      setSelectedFiles([]);
    } else {
      setSelectionMode(true);
      setSelectedFiles([]);
    }
  };

  const toggleCheckbox = (file: string) => {
    setSelectedFiles((prev) =>
      prev.includes(file) ? prev.filter((f) => f !== file) : [...prev, file]
    );
  };

  return (
    <>
      {/* Fixed Success Alert */}
      {successMessage && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 2000,
            width: "auto",
            maxWidth: "600px",
          }}
        >
          <Alert
            variant="success"
            onClose={() => setSuccessMessage(null)}
            dismissible
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
          marginTop: "2rem",
        }}
      >
        <h2 style={{ margin: 0 }}>Documents</h2>

        <div style={{ display: "flex", gap: "1rem" }}>
          {/* Create Button */}
          <button
            style={{
              padding: "0.5rem 1rem",
              background: colors.red,
              color: "white",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
            }}
            onClick={() => setShowOffcanvas(true)}
          >
            Create
          </button>

          {/* Upload Button */}
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
            Upload Document
            <input
              type="file"
              accept="application/pdf"
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSuccessMessage(
                    `Document "${e.target.files[0].name}" uploaded successfully!`
                  );
                }
              }}
            />
          </label>

          {/* ✅ Reuse SelectToggleButton */}
          <SelectToggleButton
            selectionMode={selectionMode}
            onToggle={toggleSelectionMode}
          />
        </div>
      </div>

      <hr style={{ border: `2px solid ${colors.red3}`, marginBottom: "1rem" }} />

      {/* Documents List */}
      <ul>
        {files.map((file, index) => (
          <li key={index} style={{ marginBottom: "1.5rem" }}>
            <span style={{ fontWeight: "bold" }}>{file}</span>
            <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center" }}>
              {!selectionMode && (
                <>
                  <button
                    style={{
                      marginRight: "1rem",
                      padding: "0.5rem 1rem",
                      background: colors.gold,
                      color: "white",
                      borderRadius: "8px",
                      border: "none",
                      cursor: "pointer",
                    }}
                    onClick={() => setPreviewFile(`/${file}`)}
                  >
                    Preview
                  </button>
                  <a
                    href={`/${file}`}
                    download
                    style={{
                      marginRight: "1rem",
                      padding: "0.5rem 1rem",
                      background: colors.red1,
                      color: "white",
                      borderRadius: "8px",
                      textDecoration: "none",
                    }}
                  >
                    Download
                  </a>
                </>
              )}

              {/* ✅ Checkbox appears only in selection mode */}
              {selectionMode && (
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
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

      {/* PDF Preview Modal */}
      {previewFile && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setPreviewFile(null)}
        >
          <div
            style={{
              width: "80%",
              height: "80%",
              backgroundColor: "white",
              position: "relative",
              borderRadius: "10px",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={previewFile}
              style={{ width: "100%", height: "100%", border: "none" }}
              title="PDF Preview"
            />
            <button
              onClick={() => setPreviewFile(null)}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: colors.red,
                color: "white",
                border: "none",
                borderRadius: "5px",
                padding: "0.5rem 1rem",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Offcanvas */}
      <CreateDocumentOffcanvas
        show={showOffcanvas}
        onHide={() => setShowOffcanvas(false)}
      />
    </>
  );
};

export default DocumentsSection;