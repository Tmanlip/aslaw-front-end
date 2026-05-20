// src/components/Sidebar/SideBar.tsx
import React from "react";
import Offcanvas from "react-bootstrap/Offcanvas";
import Nav from "react-bootstrap/Nav";
import { Link, useLocation } from "react-router-dom";
import { colors } from "../../constant/color";
import PATH from "../../constant/paths";
import { useAuth } from "../../context/AuthContext";
import AppRoutes from "../../routes/AppRouter";

type SidebarProps = {
  show: boolean;
  handleClose: () => void;
  children?: React.ReactNode;
};

const Sidebar: React.FC<SidebarProps> = ({ show, handleClose, children }) => {
  const { role, user } = useAuth();
  const location = useLocation();
  const isDocumentGeneratorPath = (path?: string) =>
    Boolean(path && path.startsWith(PATH.DOCUMENT_GENERATOR.DASHBOARD));
  const effectiveRole = ((role || String(user?.role || "").toLowerCase()) as
    | "admin"
    | "adminstaff"
    | "junioradmin"
    | "client"
    | "lawyer"
    | "") || "";
  const isAdminLike = effectiveRole === "admin" || effectiveRole === "adminstaff" || effectiveRole === "junioradmin";
  const roleRoutes = AppRoutes(effectiveRole || null);
  const adminExtraRoutes =
    effectiveRole === "admin"
      ? [{ path: PATH.ADMIN.SCHEDULE_MEETING }, { path: PATH.ADMIN.LOGS }]
      : [];
  const adminExcludedPaths = new Set([
    PATH.ADMIN.BILLING,
    PATH.ADMIN.LAWYER_BILLING,
    PATH.ADMIN.REGISTER_USER,
    PATH.ADMIN.MANAGE_PROFILE,
    PATH.ADMIN.EDIT_CASE,
    PATH.ADMIN.ASSIGN_CASE,
    PATH.ADMIN.REGISTER_CASE,
    PATH.ADMIN.SEARCH,
    PATH.JUNIOR_ADMIN.REGISTER_USER,
    PATH.JUNIOR_ADMIN.MANAGE_PROFILE,
    PATH.JUNIOR_ADMIN.REGISTER_CASE,
    PATH.ADMIN_STAFF.REGISTER_USER,
    PATH.ADMIN_STAFF.MANAGE_PROFILE,
    PATH.ADMIN_STAFF.REGISTER_CASE,
  ]);

  const sidebarRoutes =
    isAdminLike
      ? roleRoutes.filter(
          (r) =>
            !r.path ||
            (!adminExcludedPaths.has(r.path) && !isDocumentGeneratorPath(r.path))
        )
      : roleRoutes.filter((r) =>
          r.path ? !isDocumentGeneratorPath(r.path) : true
        );

  const sidebarRouteMap = new Map<string, { path?: string }>();
  [...sidebarRoutes, ...adminExtraRoutes].forEach((route) => {
    if (route.path) {
      sidebarRouteMap.set(route.path, route);
    }
  });

  const sidebarRouteItems = Array.from(sidebarRouteMap.values());

  return (
    <Offcanvas
      className="aslaw-metis-sidebar"
      show={show}
      onHide={handleClose}
      style={{ width: "min(86vw, 280px)", backgroundColor: colors.gold, color: colors.white }}
    >
      <Offcanvas.Header closeButton closeVariant="white">
        <Offcanvas.Title>Menu</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        {children}

        <Nav className="flex-column">
          {sidebarRouteItems.map((route, i) =>
            route.path ? (
              <Nav.Link
                key={i}
                as={Link}
                to={route.path}
                onClick={handleClose}
                className={`aslaw-sidebar-link ${location.pathname === route.path ? "active" : ""}`}
              >
                {route.path
                  .split("/")
                  .pop()
                  ?.replace("-", " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase()) ?? "Menu Item"}
              </Nav.Link>
            ) : null
          )}
        </Nav>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default Sidebar;