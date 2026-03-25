// src/components/Sidebar/SideBar.tsx
import React from "react";
import Offcanvas from "react-bootstrap/Offcanvas";
import Nav from "react-bootstrap/Nav";
import { Link } from "react-router-dom";
import { colors } from "../../constant/color";
import PATH from "../../constant/paths";
import { useAuth } from "../../context/AuthContext";
import AppRoutes from "../../routes/AppRouter";
import chatbotRoutes from "../../routes/ChatbotRoutes";

type SideBarProps = {
  show: boolean;
  handleClose: () => void;
  children?: React.ReactNode;
};

const SideBar: React.FC<SideBarProps> = ({ show, handleClose, children }) => {
  const { role } = useAuth();
  const roleRoutes = AppRoutes(role);
  const adminExtraRoutes = role === "admin" ? [{ path: PATH.ADMIN.LOGS }] : [];

  const sidebarRoutes =
    role === "admin"
      ? roleRoutes.filter(
          (r) =>
            !r.path?.includes("billing") &&
            !r.path?.includes("manage_user/register") &&
            !r.path?.includes("manage_user/manage_profile") &&
            !r.path?.includes("manage_case/edit_case") &&
            !r.path?.includes("manage_case/assign_case") &&
            !r.path?.includes("manage_case/register_case") &&
            !r.path?.includes("client/reset_password") &&
            !r.path?.includes("lawyer/reset_password")
        )
      : roleRoutes;

  const sidebarRouteMap = new Map<string, { path?: string }>();
  [...sidebarRoutes, ...adminExtraRoutes].forEach((route) => {
    if (route.path) {
      sidebarRouteMap.set(route.path, route);
    }
  });

  const sidebarRouteItems = Array.from(sidebarRouteMap.values());

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

          {chatbotRoutes.map((route, i) =>
            route.path ? (
              <Nav.Link
                key={`chatbot-${i}`}
                as={Link}
                to={route.path}
                style={{ color: colors.white, marginBottom: "1rem" }}
              >
                {route.path
                  .split("/")
                  .pop()
                  ?.replace("-", " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase()) ?? "Chatbot"}
              </Nav.Link>
            ) : null
          )}
        </Nav>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default SideBar;