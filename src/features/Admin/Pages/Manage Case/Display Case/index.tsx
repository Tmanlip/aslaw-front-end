// src/pages/HomePage.tsx
import React from "react";
import NavBarAdmin from "../../../../../shared/Navbar/NavBar Admin/new";
import CaseTable from "./Table";
import "./displayCase.css";

const DisplayCase: React.FC = () => {
  return (
    <>
      {/* NavBar on top */}
      <NavBarAdmin />

      {/* Main content */}
      <div className="admin-display-case-page">
        <h2>Cases List</h2>
        <div className="admin-display-case-table-wrap">
          <CaseTable />
        </div>
      </div>
    </>
  );
};

export default DisplayCase;
