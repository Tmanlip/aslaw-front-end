// src/pages/HomePage.tsx
import React from "react";
import NavBarAdmin from "../../../../../shared/Navbar/NavBar Admin/new";
import UserTable from "./Table";

const DisplayCase: React.FC = () => {
  return (
    <>
      {/* NavBar on top */}
      <NavBarAdmin />

      {/* Main content */}
      <div style={{ padding: "2rem" }}>
        <h2>User List</h2>
        <UserTable />
      </div>
    </>
  );
};

export default DisplayCase;
