import React from "react";
import NavBarAdmin from "../../../../../shared/Navbar/NavBar Admin/new";
import CaseProgress from "./CaseProgress";
import { useClientData, Case } from "../../../../../context/ClientDataContext";
import Button from "react-bootstrap/Button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../../context/AuthContext"; 
import AppRoutes from "../../../../../routes/AppRouter";
import PATH from "../../../../../constant/paths";
import "./lawyerBilling.css";

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
          route.path.toLowerCase().includes(PATH.ADMIN.MANAGE_PROFILE.toLowerCase())
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
    navigate(PATH.ADMIN.BILLING, {
      state: {
        selectedCase: caseItem,
        lockManageUser: true, // lock Manage Client button
      },
    });
  };

  return (
    <>
      <NavBarAdmin />

      <div className="admin-lawyer-billing-page">
        <div className="admin-lawyer-billing-header-row">
          <h2>Lawyer Cases</h2>
          {role === "admin" && (
            <Button
              variant="primary"
              className="admin-lawyer-billing-manage-btn"
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
                className="admin-lawyer-case-card"
                onClick={() => handleCaseClick(c)}
              >
                <h5>{c.title}</h5>
                <p>
                  <strong>Status:</strong>{" "}
                  <span className={c.status === "Active" ? "admin-lawyer-status-active" : "admin-lawyer-status-inactive"}>
                    {c.status}
                  </span>
                </p>
                <p>
                  <strong>Client:</strong> {c.clientName}
                </p>

                <div className="admin-lawyer-case-progress-wrap">
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