import React from "react";
import Button from "react-bootstrap/Button";
import { useNavigate, useLocation } from "react-router-dom";
import NavBarAdmin from "../../../../shared/Navbar/NavBar Admin/new";
import CaseProgress from "./components/CaseProgress";
import FileSection from "./components/Tabs";
import { useAuth } from "../../../../context/AuthContext"; 
import AppRoutes from "../../../../routes/AppRouter"; 
import { useClientData } from "../../../../context/ClientDataContext";

const UpdateCheque: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth();
  const { cases } = useClientData();
  const routes = AppRoutes(role);

  // Get the selected case and the flag for locking Manage Client button
  const { selectedCase, lockManageUser } = location.state || {};

  // Determine which case to use
  const caseToManage = selectedCase || (cases.length > 0 ? cases[0] : null);

  /* ================== HANDLE MANAGE CLIENT ================== */
  const handleManageClick = () => {
    if (role !== "admin") return;
    if (lockManageUser) return; // Button locked

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
  };

  /* ================== HANDLE MANAGE CASE ================== */
  const handleManageCaseClick = () => {
    if (role !== "admin") {
      console.warn("Access denied: only admin can manage cases");
      return;
    }

    if (!caseToManage) {
      console.warn("No cases available to manage");
      return;
    }

    // Pass the full case object instead of only the ID
    navigate("/admin/manage_case/edit_case", {
      state: {
        selectedCase: caseToManage,
        successMessage: "Welcome to Manage Case",
        lockManageUser: true, // optional if needed
      },
    });

    console.log("Navigating to EditCase with selectedCase:", caseToManage);
  };

  return (
    <>
      <NavBarAdmin />

      <div style={{ padding: "2rem" }}>
        <div
          style={{
            marginTop: "2rem",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          {/* Case progress */}
          <CaseProgress caseItem={caseToManage || undefined} />

          {/* Admin buttons */}
          {role === "admin" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <Button
                variant="primary"
                style={{ padding: "0.6rem 1.5rem", fontWeight: 500, borderRadius: "8px" }}
                onClick={handleManageClick}
                disabled={lockManageUser}
              >
                Manage Client
              </Button>

              <Button
                variant="secondary"
                style={{ padding: "0.6rem 1.5rem", fontWeight: 500, borderRadius: "8px" }}
                onClick={handleManageCaseClick}
              >
                Manage Case
              </Button>
            </div>
          )}
        </div>

        {/* Files / documents section */}
        <div style={{ marginTop: "2rem" }}>
          <FileSection fileListUrl="/files/fileList.json" selectedCase={caseToManage} />
        </div>
      </div>
    </>
  );
};

export default UpdateCheque;