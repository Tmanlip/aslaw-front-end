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
        <div className="admin-lawyer-billing-header">
          <h1>Lawyer Billing</h1>
          <p>Review assigned cases and open billing details for payment progress updates.</p>
        </div>

        <div className="admin-lawyer-billing-card">
          <div className="admin-lawyer-billing-card-header-row">
            <div>
              <h2>Case List</h2>
              <p>Select a case card to open the case management.</p>
            </div>

            {role === "admin" && (
              <Button
                variant="primary"
                className="admin-lawyer-billing-manage-btn"
                onClick={handleManageUsers}
              >
                Edit Lawyer Information
              </Button>
            )}
          </div>

          <div className="admin-lawyer-billing-card-body">
            {cases.length === 0 ? (
              <div className="admin-lawyer-empty-state">
                <h3>No Assigned Cases</h3>
                <p>No cases assigned to this lawyer yet.</p>
              </div>
            ) : (
              cases.map((c: Case) => (
                <div
                  key={c.caseId}
                  className="admin-lawyer-case-card"
                  onClick={() => handleCaseClick(c)}
                >
                  <div className="admin-lawyer-case-top-row">
                    <h5>{c.title}</h5>
                    <span className={c.status === "Active" ? "admin-lawyer-status-active" : "admin-lawyer-status-inactive"}>
                      {c.status}
                    </span>
                  </div>

                  <p className="admin-lawyer-case-client">
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
      </div>
    </>
  );
};

export default LawyerBilling;