// src/pages/HomePage.tsx
import React from "react";
import NavBarLawyer from "../../../../shared/Navbar/NavBar Lawyer/new"; 
import ProfileInfo from "./ProfileInfo"; 
import { userData } from "../../../../data/userData";  // ✅ includes photo

const LawyerProfile: React.FC = () => {
  return (
    <>
      <NavBarLawyer />

      <div style={{ display: "flex", padding: "2rem", gap: "2rem" }}>
        {/* Left column: centered photo + welcome */}
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
            src={userData.photo} // ✅ using photo from userData
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
          <h1>Welcome to {userData.firstname} 🎉</h1>
          <p>This is the homepage. You can navigate using the navbar links above.</p>
          <p style={{ marginTop: "0.5rem", fontWeight: "bold" }}>
            My Passport Photo
          </p>
        </div>

        {/* Right column: Profile info (scrollable) */}
        <div style={{ flex: 1 }}>
          <ProfileInfo user={userData} />
        </div>
      </div>
    </>
  );
};

export default LawyerProfile;
