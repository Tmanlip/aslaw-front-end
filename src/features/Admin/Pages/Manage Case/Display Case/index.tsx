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
        <div className="admin-case-page-head">
          <p className="admin-case-page-kicker">ADMIN</p>
          <h2>Cases List</h2>
          <p className="admin-case-page-subtitle">Track case assignments, ownership, and matter lifecycle.</p>
        </div>
        <div className="admin-display-case-table-wrap">
          <CaseTable />
        </div>
      </div>
    </>
  );
};

export default DisplayCase;
