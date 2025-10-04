import React, { useState } from "react";
import { colors } from "../../../../../../constant/color";

interface ChequesSectionProps {
  files: {
    initial: string[];
    first: string[];
    second: string[];
    third: string[];
    final: string[];
  };
}

const ChequesSection: React.FC<ChequesSectionProps> = ({ files }) => {
  const [previewFile, setPreviewFile] = useState<string | null>(null);

  const renderSection = (title: string, sectionFiles: string[]) => (
    <div style={{ marginBottom: "2rem" }}>
      <h3 style={{ marginBottom: "0.5rem" }}>{title}</h3>
      <hr style={{ border: `1px solid ${colors.red}`, marginBottom: "1rem" }} />

      {sectionFiles.length > 0 ? (
        <ul>
          {sectionFiles.map((file, index) => (
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
      ) : (
        <p style={{ color: "#888" }}>No files uploaded</p>
      )}
    </div>
  );

  return (
    <>
      <h2 style={{ marginTop: "2rem" }}>Cheques</h2>
      <hr style={{ border: `2px solid ${colors.red}`, marginBottom: "1rem" }} />

      {renderSection("Initial Payment", files.initial)}
      {renderSection("First Payment", files.first)}
      {renderSection("Second Payment", files.second)}
      {renderSection("Third Payment", files.third)}
      {renderSection("Final Payment", files.final)}

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

export default ChequesSection;