import React, { useEffect, useState } from "react";
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
      </div>
    </>
  );
};

export default UpdateCase;