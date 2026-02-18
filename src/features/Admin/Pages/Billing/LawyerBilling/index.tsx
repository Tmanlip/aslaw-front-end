import React from "react";
import NavBarAdmin from "../../../../../shared/Navbar/NavBar Admin/new";
import CaseProgress from "./CaseProgress";
import { useClientData, Case } from "../../../../../context/ClientDataContext";
import Button from "react-bootstrap/Button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../../context/AuthContext"; 
import AppRoutes from "../../../../../routes/AppRouter";

const LawyerBilling: React.FC = () => {
  const { cases } = useClientData();
  const { role } = useAuth();
  const navigate = useNavigate();
  const routes = AppRoutes(role);

  const handleManageUsers = () => {
    if (role === "admin") {
      const manageRoute = routes.find(
        (route) =>
          route.path &&
          route.path.toLowerCase().includes("/admin/manage_user/manage_profile")
      );

      if (manageRoute?.path) {
        navigate(manageRoute.path);
      } else {
        console.warn("Manage User route not found for admin");
      }
    } else {
      console.warn("Access denied: only admin can manage users");
    }
  };

  const handleCaseClick = (caseItem: Case) => {
    navigate("/admin/billing", {
      state: {
        selectedCase: caseItem,
        lockManageUser: true, // lock Manage Client button
      },
    });
  };

  return (
    <>
      <NavBarAdmin />

      <div style={{ padding: "2rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          <h2>Lawyer Cases</h2>
          {role === "admin" && (
            <Button
              variant="primary"
              style={{ fontWeight: 500, borderRadius: "8px" }}
              onClick={handleManageUsers}
            >
              Manage Users
            </Button>
          )}
        </div>

        <div>
          {cases.length === 0 ? (
            <p>No cases assigned to this lawyer.</p>
          ) : (
            cases.map((c: Case) => (
              <div
                key={c.caseId}
                style={{
                  padding: "1rem",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  marginBottom: "1rem",
                  cursor: "pointer",
                }}
                onClick={() => handleCaseClick(c)}
              >
                <h5>{c.title}</h5>
                <p>
                  <strong>Status:</strong>{" "}
                  <span style={{ color: c.status === "Active" ? "green" : "red" }}>
                    {c.status}
                  </span>
                </p>
                <p>
                  <strong>Client:</strong> {c.clientName}
                </p>

                <div style={{ marginTop: "1rem" }}>
                  <CaseProgress caseItem={c} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default LawyerBilling;