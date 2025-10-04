import React, { useState } from "react";
import { colors } from "../../../../../../constant/color";
import Alert from "react-bootstrap/Alert";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import SelectToggleButton from "../Select Files/select";

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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  // ✅ Track upload target section
  const [uploadSection, setUploadSection] = useState<string>("initial");

  const toggleSelectionMode = () => {
    setSelectionMode((prev) => !prev);
    setSelectedFiles([]);
  };

  const toggleCheckbox = (file: string) => {
    setSelectedFiles((prev) =>
      prev.includes(file) ? prev.filter((f) => f !== file) : [...prev, file]
    );
  };

  // ✅ Helper to render each payment section
  const renderSection = (title: string, sectionFiles: string[]) => (
    <div style={{ marginBottom: "2rem" }}>
      <h4 style={{ marginTop: "1rem", color: colors.red }}>{title}</h4>
      <hr style={{ border: `1px solid ${colors.red3}`, marginBottom: "1rem" }} />
      {sectionFiles.length === 0 ? (
        <p style={{ color: colors.red1 }}>No files uploaded yet.</p>
      ) : (
        <ul>
          {sectionFiles.map((file, index) => (
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

                {selectionMode && (
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
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
      )}
    </div>
  );

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
        <h2 style={{ margin: 0 }}>Cheques</h2>

        <div style={{ display: "flex", gap: "1rem" }}>
          {/* ✅ Dropdown Upload Button */}
          <DropdownButton
            id="dropdown-upload"
            title={`Upload to ${uploadSection.toUpperCase()} section`}
            variant="warning"
            onSelect={(key) => setUploadSection(key || "initial")}
          >
            <Dropdown.Item eventKey="initial">Initial Payment</Dropdown.Item>
            <Dropdown.Item eventKey="first">First Payment</Dropdown.Item>
            <Dropdown.Item eventKey="second">Second Payment</Dropdown.Item>
            <Dropdown.Item eventKey="third">Third Payment</Dropdown.Item>
            <Dropdown.Item eventKey="final">Final Payment</Dropdown.Item>
          </DropdownButton>

          {/* Hidden file input for uploads */}
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
            Choose File
            <input
              type="file"
              accept="application/pdf"
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSuccessMessage(
                    `Cheque "${e.target.files[0].name}" uploaded successfully to ${uploadSection} section!`
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

      <hr style={{ border: `2px solid ${colors.red}`, marginBottom: "1rem" }} />

      {/* Payment Sections */}
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