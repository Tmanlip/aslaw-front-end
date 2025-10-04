import React from "react";
import { Link } from "react-router-dom";

const Forbidden: React.FC = () => {
  return (
    <div style={{ textAlign: "center", marginTop: "10%" }}>
      <h1 style={{ fontSize: "80px", color: "red" }}>403</h1>
      <h2>Unauthorized Access</h2>
      <p>You don’t have permission to view this page.</p>
      <Link to="/">⬅ Back to Home</Link>
    </div>
  );
};

export default Forbidden;
