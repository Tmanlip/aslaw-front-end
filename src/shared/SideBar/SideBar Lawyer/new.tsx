// src/components/Sidebar/SideBar.tsx
import React from "react";
import Offcanvas from "react-bootstrap/Offcanvas";
import Nav from "react-bootstrap/Nav";
import Form from "react-bootstrap/Form"; // for dropdown
import { colors } from "../../../constant/color";
import AuthMemory from "../../../data/authMemory";
import { useNavigate } from "react-router-dom";

type SidebarProps = {
  show: boolean;
  handleClose: () => void;
};

const SidebarLawyer: React.FC<SidebarProps> = ({ show, handleClose }) => {
  const lawyerData = AuthMemory.getLawyerFullData();
  const cases = lawyerData?.cases || [];
  const navigate = useNavigate();

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

          {/* --- Update Case Dropdown if multiple cases --- */}
          {cases.length > 1 ? (
            <Form.Select
              style={{ marginTop: "1rem" }}
              onChange={(e) => navigate(`/lawyer/update-case/${e.target.value}`)}
            >
              {cases.map((c) => (
                <option key={c.caseId} value={c.caseId}>
                  {c.title || c.title}
                </option>
              ))}
            </Form.Select>
          ) : (
            <Nav.Link
              href={`/lawyer/update-case/${cases[0]?.caseId || ""}`}
              style={{ color: colors.white, marginTop: "1rem" }}
            >
              Update Case
            </Nav.Link>
          )}
        </Nav>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default SidebarLawyer;