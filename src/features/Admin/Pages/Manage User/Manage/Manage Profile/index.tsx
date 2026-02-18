import React from "react";
import NavBarAdmin from "../../../../../../shared/Navbar/NavBar Admin/new";
import ProfileInfo from "./ProfileInfo";
import { useClientData, User } from "../../../../../../context/ClientDataContext"; // <-- import User
import { userData } from "../../../../../../data/userData"; // fallback photo

const ManageProfile: React.FC = () => {
  const { authUser } = useClientData(); // selected admin

  if (!authUser) {
    return (
      <div style={{ padding: "2rem" }}>
        <p>No admin selected. Please go back and select an admin.</p>
      </div>
    );
  }

  return (
    <>
      <NavBarAdmin />

      <div style={{ display: "flex", padding: "2rem", gap: "2rem" }}>
        {/* Left column: display full name and photo */}
        <LeftColumn user={authUser} />

        {/* Right column: Profile info */}
        <div style={{ flex: 1 }}>
          <ProfileInfo />
        </div>
      </div>
    </>
  );
};

// Left column is its own component so it re-renders on context changes
const LeftColumn: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div
      style={{
        flexShrink: 0,
        textAlign: "center",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        position: "sticky",
        top: 0,
      }}
    >
      <img
        src={userData.photo} // fallback
        alt="Passport"
        style={{
          width: "150px",
          height: "200px",
          objectFit: "cover",
          borderRadius: "8px",
          border: "2px solid #ccc",
          marginBottom: "1rem",
        }}
      />
      <h1>{user.name} 🎉</h1>
    </div>
  );
};

export default ManageProfile;
