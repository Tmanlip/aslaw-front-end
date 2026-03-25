import React, { useEffect, useState } from "react";
import { colors } from "../../../../../../constant/color";
import Alert from "react-bootstrap/Alert";
import CreateReportOffcanvas from "../OffCanvas/Reports";
import Form from "react-bootstrap/Form";
import SelectToggleButton from "../Select Files/select";
import AuthMemory from "../../../../../../data/authMemory";

const API_URL = process.env.REACT_APP_API_URL;

const ReportsSection: React.FC = () => {
  const currentUser = AuthMemory.getUser();
  const token = AuthMemory.getToken();

  const requestHeaders: HeadersInit = {
    Accept: "application/json",
    "X-User-Role": currentUser?.role || "",
    "X-User-FirmID": currentUser?.firmID || "",
  };

  if (token) {
    (requestHeaders as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  const [files, setFiles] = useState<string[]>([]);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch reports from Laravel
  const fetchReports = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/files`, {
        headers: requestHeaders,
      });

      const data = await res.json();

      // ✅ IMPORTANT FIX
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
      console.error("Failed to fetch reports", err);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

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
          <li key={index} style={{ marginBottom: "1.5rem" }}>
            <strong>{file}</strong>

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
                    onClick={() =>
                      setPreviewFile(`${API_URL}/read/${encodeURIComponent(file)}`)
                    }
                  >
                    Preview
                  </button>

                  {/* ✅ DOWNLOAD */}
                  <a
                    href={`${API_URL}/read/${encodeURIComponent(file)}`}
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

              {/* Selection mode */}
              {selectionMode && (
                <Form.Check
                  type="checkbox"
                  label="Choose"
                  checked={selectedFiles.includes(file)}
                  onChange={() => toggleCheckbox(file)}
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