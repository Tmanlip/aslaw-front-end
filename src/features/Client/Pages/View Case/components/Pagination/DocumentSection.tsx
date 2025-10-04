import React, { useState } from "react";
import { colors } from "../../../../../../constant/color";
import Alert from "react-bootstrap/Alert";

interface DocumentsSectionProps {
  files: string[];
}

const DocumentsSection: React.FC<DocumentsSectionProps> = ({ files }) => {
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  return (
    <>
      {/* Fixed Success Alert at the top of the page */}
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

      {/* Title + Upload Button inline */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "2rem",
        }}
      >
        <h2 style={{ margin: 0 }}>Documents</h2>
        <label
          style={{
            padding: "0.5rem 1rem",
            background: colors.gold,
            color: "white",
            borderRadius: "8px",
            cursor: "pointer",
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
      </div>

      <hr style={{ border: `2px solid ${colors.red}`, marginBottom: "1rem" }} />

      <ul>
        {files.map((file, index) => (
          <li key={index} style={{ marginBottom: "1.5rem" }}>
            <span style={{ fontWeight: "bold" }}>{file}</span>
            <div style={{ marginTop: "0.5rem" }}>
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
                  padding: "0.5rem 1rem",
                  background: colors.red1,
                  color: "white",
                  borderRadius: "8px",
                  textDecoration: "none",
                }}
              >
                Download
              </a>
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
    </>
  );
};

export default DocumentsSection;