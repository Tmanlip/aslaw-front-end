import React from "react";
import Offcanvas from "react-bootstrap/Offcanvas";

interface CreateDocumentOffcanvasProps {
  show: boolean;
  onHide: () => void;
}

const CreateDocumentOffcanvas: React.FC<CreateDocumentOffcanvasProps> = ({
  show,
  onHide,
}) => {
  return (
    <Offcanvas
      show={show}
      onHide={onHide}
      placement="end"
      backdrop="static"   // ✅ cannot close by clicking outside
      keyboard={false}    // ✅ cannot close with ESC
      style={{ width: "700px" }} // ✅ wide offcanvas
    >
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>Create New Document</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <p>This is the content area for creating a new document.</p>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default CreateDocumentOffcanvas;