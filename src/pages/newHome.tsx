// src/pages/HomePage.tsx
import React from "react";
import MyNavBar from "../shared/Navbar/NavBar Admin/new"; // ✅ adjust path to where you saved it

const NewHome: React.FC = () => {
  return (
    <>
      {/* NavBar on top */}
      <MyNavBar />

      {/* Main content */}
      <div style={{ padding: "2rem" }}>
        <h1>Welcome to MyApp 🎉</h1>
        <p>
          This is the homepage. You can navigate using the navbar links above.
        </p>
      </div>
    </>
  );
};

export default NewHome;
