import React from "react";
import NavBarClient from "../../../../shared/Navbar/NavBar Client/new";
import CaseProgress from "./components/CaseProgress";
import FileSection from "./components/Tabs";

const UpdateCheque: React.FC = () => {
  return (
    <>
      {/* Navbar */}
      <NavBarClient />

      <div style={{ padding: "2rem" }}>
        {/* Case Progress Bar */}
        <div style={{ marginTop: "2rem" }}>
          <CaseProgress />
        </div>

        {/* Documents / Reports / Cheques Section */}
        <FileSection fileListUrl="/files/fileList.json" />
      </div>
    </>
  );
};

export default UpdateCheque;