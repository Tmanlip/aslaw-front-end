// src/components/Sidebar/SideBar.tsx
import React from "react";
import Offcanvas from "react-bootstrap/Offcanvas";
import Nav from "react-bootstrap/Nav";
import { Link } from "react-router-dom";
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
  const effectiveRole = ((role || String(user?.role || "").toLowerCase()) as
    | "admin"
    | "client"
    | "lawyer"
    | "") || "";
  const roleRoutes = AppRoutes(effectiveRole || null);
  const adminExtraRoutes = effectiveRole === "admin" ? [{ path: PATH.ADMIN.LOGS }] : [];
  const adminExcludedPaths = new Set([
    PATH.ADMIN.BILLING,
    PATH.ADMIN.LAWYER_BILLING,
    PATH.ADMIN.REGISTER_USER,
    PATH.ADMIN.MANAGE_PROFILE,
    PATH.ADMIN.EDIT_CASE,
    PATH.ADMIN.ASSIGN_CASE,
    PATH.ADMIN.REGISTER_CASE,
    PATH.ADMIN.CHATBOT,
  ]);

  const sidebarRoutes =
    effectiveRole === "admin"
      ? roleRoutes.filter(
          (r) => !r.path || !adminExcludedPaths.has(r.path)
        )
      : roleRoutes.filter((r) =>
          r.path
            ? r.path !== PATH.CLIENT.CHATBOT && r.path !== PATH.LAWYER.CHATBOT
            : true
        );

  const sidebarRouteMap = new Map<string, { path?: string }>();
  [...sidebarRoutes, ...adminExtraRoutes].forEach((route) => {
    if (route.path) {
      sidebarRouteMap.set(route.path, route);
    }
  });

  const sidebarRouteItems = Array.from(sidebarRouteMap.values());
  const chatbotPath =
    effectiveRole === "admin"
      ? PATH.ADMIN.CHATBOT
      : effectiveRole === "client"
      ? PATH.CLIENT.CHATBOT
      : effectiveRole === "lawyer"
      ? PATH.LAWYER.CHATBOT
      : PATH.CHATBOT.ROOT;

  return (
    <Offcanvas
      show={show}
      onHide={handleClose}
      style={{ width: "250px", backgroundColor: colors.gold, color: colors.white }}
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
                style={{ color: colors.white, marginBottom: "1rem" }}
              >
                {route.path
                  .split("/")
                  .pop()
                  ?.replace("-", " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase()) ?? "Menu Item"}
              </Nav.Link>
            ) : null
          )}

          <hr style={{ borderColor: colors.white, opacity: 0.5 }} />

          <Nav.Link
            as={Link}
            to={chatbotPath}
            style={{ color: colors.white, marginBottom: "1rem" }}
          >
            Internal Chatbot
          </Nav.Link>
        </Nav>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default Sidebar;