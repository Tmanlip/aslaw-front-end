import React from "react";
import NavBarClient from "../../../../shared/Navbar/NavBar Client/new";
import CaseProgress from "./components/CaseProgress";
import FileSection from "./components/Pagination";
import { useEffect, useState } from "react";
import AuthMemory from "../../../../data/authMemory";
import { fetchClientFullData } from "../../../../hooks/clientApi";
import { Case, ClientFullData } from "../../../../data/userInfo";

const ViewCase: React.FC = () => {
  const [data, setData] = useState<ClientFullData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  useEffect(() => {
    const firmID = AuthMemory.getUser()?.firmID;

    if (!firmID) {
      setLoading(false);
      return;
    }

    fetchClientFullData(firmID)
      .then((res) => {
        setData(res);
        if (res.cases?.length) {
          setSelectedCase(res.cases[0]);
        }
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <NavBarClient />
        <div style={{ padding: "2rem" }}>Loading case data...</div>
      </>
    );
  }

  if (!data || data.cases.length === 0) {
    return (
      <>
        <NavBarClient />
        <div style={{ padding: "2rem" }}>No case available.</div>
      </>
    );
  }

  return (
    <>
      {/* Navbar */}
      <NavBarClient />

      <div style={{ padding: "2rem" }}>
        {/* Case Progress Bar */}
        <div style={{ marginTop: "2rem" }}>
          <CaseProgress
            cases={data.cases}
            selectedCase={selectedCase}
            onSelectCase={setSelectedCase}
          />
        </div>

        {/* Documents / Reports / Cheques Section */}
        {selectedCase && <FileSection selectedCase={selectedCase} />}
      </div>
    </>
  );
};

export default ViewCase;