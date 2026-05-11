// src/pages/HomePage.tsx
import React from "react";
import NavBarAdmin from "../../../../../shared/Navbar/NavBar Admin/new";
import UserTable from "../Manage/Table/index";
import "./manageUser.css";

const ManageUser: React.FC = () => {
  return (
    <>
      {/* NavBar on top */}
      <NavBarAdmin />

      {/* Main content */}
      <div className="admin-manage-user-page">
        <div className="admin-list-page-head">
          <p className="admin-list-page-kicker">ADMIN</p>
          <h2>User List</h2>
          <p className="admin-list-page-subtitle">Manage platform users, access status, and profile operations.</p>
        </div>
        <div className="admin-manage-user-table-wrap">
          <UserTable />
        </div>
      </div>
    </>
  );
};

export default ManageUser;
