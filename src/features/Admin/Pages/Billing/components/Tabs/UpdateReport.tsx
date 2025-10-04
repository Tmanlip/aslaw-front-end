import React, { useState } from "react";
import { colors } from "../../../../../../constant/color";
import Alert from "react-bootstrap/Alert";
import CreateReportOffcanvas from "../OffCanvas/Reports";
import Form from "react-bootstrap/Form";
import SelectToggleButton from "../Select Files/select";

interface ReportsSectionProps {
  files: string[];
}

const ReportsSection: React.FC<ReportsSectionProps> = ({ files }) => {
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const toggleSelectionMode = () => {
    if (selectionMode) {
      // Cancel selection
      setSelectionMode(false);
      setSelectedFiles([]);
    } else {
      // Enter selection mode (checkboxes only, no auto select)
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
        <h2 style={{ margin: 0 }}>Reports</h2>
        <div style={{ display: "flex", gap: "1rem" }}>
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
            Upload Report
            <input
              type="file"
              accept="application/pdf"
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSuccessMessage(
                    `Report "${e.target.files[0].name}" uploaded successfully!`
                  );
                }
              }}
            />
          </label>

          {/* ✅ Toggle Select/Cancel */}
          <SelectToggleButton
            selectionMode={selectionMode}
            onToggle={toggleSelectionMode}
          />
        </div>
      </div>

      <hr style={{ border: `2px solid ${colors.red}`, marginBottom: "1rem" }} />

      {/* Reports List */}
      <ul>
        {files.map((file, index) => (
          <li key={index} style={{ marginBottom: "1.5rem" }}>
            <span style={{ fontWeight: "bold" }}>{file}</span>
            <div
              style={{
                marginTop: "0.5rem",
                display: "flex",
                alignItems: "center",
              }}
            >
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

              {/* ✅ Bootstrap Checkbox with fade */}
              <div
                style={{
                  opacity: selectionMode ? 1 : 0,
                  maxWidth: selectionMode ? "200px" : "0px",
                  transition: "all 0.4s ease",
                  overflow: "hidden",
                }}
              >
                {selectionMode && (
                  <Form.Check
                    type="checkbox"
                    label="Choose"
                    checked={selectedFiles.includes(file)}
                    onChange={() => toggleCheckbox(file)}
                  />
                )}
              </div>
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
      <CreateReportOffcanvas
        show={showOffcanvas}
        onHide={() => setShowOffcanvas(false)}
      />
    </>
  );
};

export default ReportsSection;