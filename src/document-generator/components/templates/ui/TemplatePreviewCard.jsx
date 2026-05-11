import React from "react";
import { ArrowLeft, Copy, Check, FileText, FileDown } from "lucide-react";
import "../../../styles/documentGenerator.css";

const TemplatePreviewCard = ({
  copied,
  onBackToEdit,
  onCopy,
  onExportPDF,
  onExportDOCX,
  onUploadToCasePdf,
  uploadToCaseLabel,
  uploadToCaseDisabled,
  uploadToCaseLoading,
  uploadStatusMessage,
  syncStatusMessage,
  pdfPreviewUrl,
  children,
}) => {
  return (
    <div className="dg-page">
      <div className="dg-container" style={{ maxWidth: 980 }}>
        <button
          onClick={onBackToEdit}
          className="dg-link-back"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to edit
        </button>

        <div className="dg-shell">
          <div className="dg-shell-head">
            <h2>
              Generated Result
            </h2>

            <div className="dg-actions">
              <button
                onClick={onCopy}
                className="dg-btn dg-btn-accent"
              >
                {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                {copied ? "Copied" : "Copy"}
              </button>

              <button
                onClick={onExportPDF}
                className="dg-btn dg-btn-success"
              >
                <FileDown className="w-4 h-4 mr-1" />
                PDF
              </button>

              <button
                onClick={onExportDOCX}
                className="dg-btn dg-btn-neutral"
              >
                <FileText className="w-4 h-4 mr-1" />
                DOCX
              </button>

              {onUploadToCasePdf && (
                <button
                  onClick={onUploadToCasePdf}
                  disabled={uploadToCaseDisabled}
                  className="dg-btn dg-btn-primary"
                >
                  {uploadToCaseLoading ? "Uploading..." : uploadToCaseLabel || "Upload to Case (PDF)"}
                </button>
              )}
            </div>
          </div>

          {uploadStatusMessage && (
            <div className="dg-note" style={{ margin: "0.75rem 1rem 0" }}>
              {uploadStatusMessage}
            </div>
          )}

          {syncStatusMessage && (
            <div className="dg-note" style={{ margin: "0.75rem 1rem 0" }}>
              {syncStatusMessage}
            </div>
          )}

          <div className="dg-body" style={{ backgroundColor: "#fafdfb" }}>
            {pdfPreviewUrl ? (
              <iframe
                src={pdfPreviewUrl}
                title="Document Preview"
                style={{ width: "100%", height: "80vh", border: "none", borderRadius: 4 }}
              />
            ) : (
              children
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreviewCard;
