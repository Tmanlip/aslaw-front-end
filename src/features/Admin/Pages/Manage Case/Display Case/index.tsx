// src/pages/HomePage.tsx
import React from "react";
import NavBarAdmin from "../../../../../shared/Navbar/NavBar Admin/new";
import CaseTable from "./Table";

const DisplayCase: React.FC = () => {
  return (
    <>
      {/* NavBar on top */}
      <NavBarAdmin />

      {/* Main content */}
      <div style={{ padding: "2rem" }}>
        <h2>Cases List</h2>
        <CaseTable />
      </div>
    </>
  );
};

export default DisplayCase;
