import React, { useEffect, useState } from "react";
import NavBarLawyer from "../../../../shared/Navbar/NavBar Lawyer/new";
import AuthMemory from "../../../../data/authMemory";
import { fetchLawyerFullData } from "../../../../hooks/lawyerApi";
import CaseProgress from "./components/CaseProgress";
import FileSection from "./components/Tabs";
import { Case, LawyerFullData } from "../../../../data/userInfo";

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
        <div style={{ padding: "2rem" }}>Loading case data...</div>
      </>
    );
  }

  if (!data || data.cases.length === 0) {
    return (
      <>
        <NavBarLawyer />
        <div style={{ padding: "2rem" }}>No case available.</div>
      </>
    );
  }

  return (
    <>
      <NavBarLawyer />

      <div style={{ padding: "2rem" }}>
        {/* Case Progress with multi-case support */}
        <div style={{ marginTop: "2rem" }}>
          <CaseProgress 
            cases={data.cases} 
            selectedCase={selectedCase} 
            onSelectCase={setSelectedCase} 
          />
        </div>

        {/* Documents / Reports / Cheques */}
        {selectedCase && <FileSection selectedCase={selectedCase} />}
      </div>
    </>
  );
};

export default UpdateCase;