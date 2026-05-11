import React from "react";
import NavBarAdmin from "../../../../../../shared/Navbar/NavBar Admin/new";
import ProfileInfo from "./ProfileInfo";
import { useClientData, User } from "../../../../../../context/ClientDataContext"; // <-- import User
import { userData } from "../../../../../../data/userData"; // fallback photo
import "./manageProfile.css";

const ManageProfile: React.FC = () => {
  const { authUser } = useClientData(); // selected admin

  if (!authUser) {
    return (
      <div className="admin-manage-profile-state">
        <p>No admin selected. Please go back and select an admin.</p>
      </div>
    );
  }

  return (
    <>
      <NavBarAdmin />

      <div className="admin-manage-profile-page">
        {/* Left column: display full name and photo */}
        <LeftColumn user={authUser} />

        {/* Right column: Profile info */}
        <div className="admin-manage-profile-content">
          <ProfileInfo />
        </div>
      </div>
    </>
  );
};

// Left column is its own component so it re-renders on context changes
const LeftColumn: React.FC<{ user: User }> = ({ user }) => {
  const userStatus = user.status || "Active";

  return (
    <div className="admin-manage-profile-sidebar">
      <img
        src={userData.photo} // fallback
        alt="Passport"
        className="admin-manage-profile-avatar"
      />
      <h1 className="admin-manage-profile-title">{user.name}</h1>

      <div className="admin-manage-profile-meta">
        <span className="admin-manage-profile-meta-item">
          Firm ID: {user.firmID || "-"}
        </span>
        <span className={`admin-manage-profile-status ${String(userStatus).toLowerCase() === "inactive" ? "is-inactive" : "is-active"}`}>
          {userStatus}
        </span>
      </div>
    </div>
  );
};

export default ManageProfile;
