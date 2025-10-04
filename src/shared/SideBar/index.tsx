// src/components/Sidebar/SideBar.tsx
import React from "react";
import Offcanvas from "react-bootstrap/Offcanvas";
import Nav from "react-bootstrap/Nav";
import { Link } from "react-router-dom";
import { colors } from "../../constant/color";
import { useAuth } from "../../context/AuthContext";
import AppRoutes from "../../routes/AppRouter";
import chatbotRoutes from "../../routes/ChatbotRoutes";

type SideBarProps = {
  show: boolean;
  handleClose: () => void;
  children?: React.ReactNode; // ✅ allow children
};

const SideBar: React.FC<SideBarProps> = ({ show, handleClose, children }) => {
  const { role } = useAuth();
  const roleRoutes = AppRoutes(role);

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
        {children} {/* ✅ render children from NavBarAdmin */}

        <Nav className="flex-column">
          {/* Role-based links */}
          {roleRoutes.map((route, i) =>
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

          {/* Chatbot links at bottom */}
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
