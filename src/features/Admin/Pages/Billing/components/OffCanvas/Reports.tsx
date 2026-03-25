import React from "react";
import Offcanvas from "react-bootstrap/Offcanvas";

interface CreateReportOffcanvasProps {
  show: boolean;
  onHide: () => void;
}

const CreateReportOffcanvas: React.FC<CreateReportOffcanvasProps> = ({
  show,
  onHide,
}) => {
  return (
    <Offcanvas
      show={show}
      onHide={onHide}
      placement="end"
      backdrop="static"   // ✅ prevents closing when clicking outside
      keyboard={false}    // ✅ prevents closing with ESC
      style={{ width: "min(92vw, 700px)" }}
    >
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>Create New Report</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <p>This is the content area for creating a new report.</p>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default CreateReportOffcanvas;