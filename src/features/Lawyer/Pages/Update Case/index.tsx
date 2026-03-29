import React, { useEffect, useMemo, useState } from "react";
import NavBarLawyer from "../../../../shared/Navbar/NavBar Lawyer/new";
import AuthMemory from "../../../../data/authMemory";
import { fetchLawyerFullData, invalidateLawyerCache } from "../../../../hooks/lawyerApi";
import CaseProgress from "./components/CaseProgress";
import FileSection from "./components/Tabs";
import { Case, LawyerFullData } from "../../../../data/userInfo";
import "./updateCase.css";

const UpdateCase: React.FC = () => {
  const [data, setData] = useState<LawyerFullData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isDocGeneratorOpen, setIsDocGeneratorOpen] = useState(false);

  const documentGeneratorUrl =
    process.env.REACT_APP_DOCUMENT_GENERATOR_URL || "http://localhost:5173";

  const documentGeneratorSrc = useMemo(() => {
    if (!selectedCase) return documentGeneratorUrl;

    const params = new URLSearchParams({
      source: "aslaw-front-end",
      caseId: String(selectedCase.caseId),
      caseTitle: selectedCase.title || "",
    });

    const separator = documentGeneratorUrl.includes("?") ? "&" : "?";
    return `${documentGeneratorUrl}${separator}${params.toString()}`;
  }, [documentGeneratorUrl, selectedCase]);

  useEffect(() => {
    const firmID = AuthMemory.getUser()?.firmID;

    if (firmID) {
      fetchLawyerFullData(firmID)
        .then((res) => {
          setData(res);
          AuthMemory.setLawyerFullData?.(res);

          // Automatically select the first case
          if (res.cases?.length) setSelectedCase(res.cases[0]);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Callback to refresh case data after file upload/delete
  const handleFileChangeSuccess = async () => {
    const firmID = AuthMemory.getUser()?.firmID;
    if (firmID) {
      try {
        // Invalidate cache to force fresh fetch
        invalidateLawyerCache(firmID);
        // Refetch the data
        const freshData = await fetchLawyerFullData(firmID);
        setData(freshData);
        AuthMemory.setLawyerFullData?.(freshData);
        
        // Update selected case with fresh data if it exists
        if (selectedCase && freshData.cases?.length) {
          const updatedCase = freshData.cases.find((c) => c.caseId === selectedCase.caseId);
          if (updatedCase) {
            setSelectedCase(updatedCase);
          }
        }
      } catch (err) {
        console.error("Failed to refresh case data after file change:", err);
      }
    }
  };

  // Debug log for cases
  useEffect(() => {
    if (data) {
      console.log("RAW DATA FROM API:", JSON.stringify(data, null, 2));
    }
  }, [data]);

  useEffect(() => {
    if (!isDocGeneratorOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDocGeneratorOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isDocGeneratorOpen]);

  if (loading) {
    return (
      <>
        <NavBarLawyer />
        <div className="lawyer-update-case-state">Loading case data...</div>
      </>
    );
  }

  if (!data || data.cases.length === 0) {
    return (
      <>
        <NavBarLawyer />
        <div className="lawyer-update-case-state">No case available.</div>
      </>
    );
  }

  return (
    <>
      <NavBarLawyer />

      <div className="lawyer-update-case-page">
        <div className="lawyer-update-case-actions">
          <button
            type="button"
            className="lawyer-create-document-btn"
            onClick={() => setIsDocGeneratorOpen(true)}
            disabled={!selectedCase}
          >
            Create Document
          </button>
        </div>

        {/* Case Progress with multi-case support */}
        <div className="lawyer-update-case-progress-wrap">
          <CaseProgress 
            cases={data.cases} 
            selectedCase={selectedCase} 
            onSelectCase={setSelectedCase} 
          />
        </div>

        {/* Documents / Reports / Cheques */}
        {selectedCase && (
          <FileSection
            selectedCase={selectedCase}
            onUploadSuccess={handleFileChangeSuccess}
            onDeleteSuccess={handleFileChangeSuccess}
          />
        )}

        {isDocGeneratorOpen && (
          <div
            className="lawyer-doc-generator-overlay"
            onClick={() => setIsDocGeneratorOpen(false)}
          >
            <div
              className="lawyer-doc-generator-modal"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Create document"
            >
              <div className="lawyer-doc-generator-header">
                <div>
                  <h2>Create Document</h2>
                  {selectedCase && (
                    <p>
                      Case: {selectedCase.title} (#{selectedCase.caseId})
                    </p>
                  )}
                </div>
                <div className="lawyer-doc-generator-header-actions">
                  <a
                    href={documentGeneratorSrc}
                    target="_blank"
                    rel="noreferrer"
                    className="lawyer-doc-generator-open-tab"
                  >
                    Open in New Tab
                  </a>
                  <button
                    type="button"
                    className="lawyer-doc-generator-close-btn"
                    onClick={() => setIsDocGeneratorOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </div>

              <iframe
                title="ASLAW Document Generator"
                src={documentGeneratorSrc}
                className="lawyer-doc-generator-iframe"
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UpdateCase;