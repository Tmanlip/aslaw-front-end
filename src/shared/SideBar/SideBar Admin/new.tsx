// src/components/Sidebar/SideBar.tsx
import React, { ReactNode } from "react";
import Offcanvas from "react-bootstrap/Offcanvas";
import Nav from "react-bootstrap/Nav";
import { colors } from "../../../constant/color";

type SideBarProps = {
  show: boolean;
  handleClose: () => void;
  children?: ReactNode; // ✅ allow children
};

const SideBarAdmin: React.FC<SideBarProps> = ({ show, handleClose, children }) => {
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
        {children} {/* ✅ render children if provided */}
        <Nav className="flex-column">
          <Nav.Link href="#dashboard" style={{ color: colors.white, marginBottom: "1rem" }}>
            Dashboard
          </Nav.Link>
          <Nav.Link href="#profile" style={{ color: colors.white, marginBottom: "1rem" }}>
            Profile
          </Nav.Link>
          <Nav.Link href="#settings" style={{ color: colors.white, marginBottom: "1rem" }}>
            Settings
          </Nav.Link>
          <Nav.Link href="#help" style={{ color: colors.white, marginBottom: "1rem" }}>
            Help
          </Nav.Link>
        </Nav>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default SideBarAdmin;