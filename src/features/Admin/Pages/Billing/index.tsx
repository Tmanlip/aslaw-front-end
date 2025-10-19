import React from "react";
import Button from "react-bootstrap/Button";
import { useNavigate } from "react-router-dom";
import NavBarAdmin from "../../../../shared/Navbar/NavBar Admin/new";
import CaseProgress from "./components/CaseProgress";
import FileSection from "./components/Tabs";
import { useAuth } from "../../../../context/AuthContext"; // adjust path as needed
import AppRoutes from "../../../../routes/AppRouter"; // ✅ only this import

const UpdateCheque: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuth();

  // Load only the routes for the current role
  const routes = AppRoutes(role);

  const handleManageClick = () => {
    if (role === "admin") {
      // Find the route that contains "manage-user" or similar
      const manageRoute = routes.find(
        (route) => route.path && route.path.toLowerCase().includes("/admin/manage_user/manage_profile")
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

  return (
    <>
      {/* Navbar */}
      <NavBarAdmin />

      <div style={{ padding: "2rem" }}>
        {/* Case Progress Bar with Button on the right */}
        <div
          style={{
            marginTop: "2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <CaseProgress />

          {role === "admin" && (
            <Button
              variant="primary"
              style={{
                padding: "0.6rem 1.5rem",
                fontWeight: 500,
                borderRadius: "8px",
              }}
              onClick={handleManageClick}
            >
              Manage Users
            </Button>
          )}
        </div>

        {/* Documents / Reports / Cheques Section */}
        <div style={{ marginTop: "2rem" }}>
          <FileSection fileListUrl="/files/fileList.json" />
        </div>
      </div>
    </>
  );
};

export default UpdateCheque;