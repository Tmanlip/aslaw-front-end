// src/pages/HomePage.tsx
import React, { useState } from "react";
import NavBarAdmin from "../../../../../../shared/Navbar/NavBar Admin/new";
import Page1Form from "./pageoneform";
import CustomPagination from "./Pagination";

const RegisterCase: React.FC = () => {
  // Page states
  const [page, setPage] = useState(1);

  // Page 1 states
  const [caseName, setCaseName] = useState("");
  const [description, setDescription] = useState("");
  const [lawyer, setLawyer] = useState("");

  // TODO: if you add more pages later, you can manage their states here

  const handleSubmit = () => {
    const formData = {
      caseName,
      description,
      lawyer,
    };
    console.log("Submitted Case Data:", formData);
    alert("Case registered! Check console for details.");
  };

  return (
    <>
      {/* NavBar on top */}
      <NavBarAdmin />

      {/* Main content */}
      <div style={{ padding: "2rem" }}>
        <h1>Register Case</h1>
        <p>Please fill out the details below:</p>

        {/* Page Forms */}
        {page === 1 && (
          <Page1Form
            caseName={caseName}
            setCaseName={setCaseName}
            description={description}
            setDescription={setDescription}
            lawyer={lawyer}
            setLawyer={setLawyer}
          />
        )}

        {/* ✅ Custom Pagination */}
        <CustomPagination
          currentPage={page}
          totalPages={1} // change to >1 when you add more pages
          onPageChange={(p) => setPage(p)}
        />

        {/* Submit button */}
        {page === 1 && (
          <div className="d-flex justify-content-end mt-3">
            <button className="btn btn-success" onClick={handleSubmit}>
              Submit Case
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default RegisterCase;
