// src/components/AddCaseOffcanvas.tsx
import React, { useState } from "react";
import Offcanvas from "react-bootstrap/Offcanvas";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import Alert from "react-bootstrap/Alert";

interface CaseRecord {
  id: number;
  clientName?: string;
  lawyerName?: string;
  caseName?: string;
}

interface AddCaseOffcanvasProps {
  show: boolean;
  handleClose: () => void;
  selectedCase: CaseRecord | null;
}

const AssignCase: React.FC<AddCaseOffcanvasProps> = ({
  show,
  handleClose,
  selectedCase,
}) => {
  const [status, setStatus] = useState("Pending");
  const [showAlert, setShowAlert] = useState(false);

  const handleStatusSelect = (eventKey: string | null) => {
    if (eventKey) setStatus(eventKey);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Replace with DB/API call later
    alert(
      `Case Saved!\nTitle: ${(
        e.target as HTMLFormElement
      ).caseTitle.value}\nDescription: ${
        (e.target as HTMLFormElement).caseDescription.value
      }\nStatus: ${status}`
    );
    handleClose();
  };

  // When clicking X, show alert instead of closing immediately
  const handleTryClose = () => {
    setShowAlert(true);
  };

  return (
    <Offcanvas
      show={show}
      onHide={handleTryClose} // intercept close
      placement="end"
      backdrop="static" // prevent outside click closing
      keyboard={false} // prevent ESC closing
    >
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>
          Add Case for {selectedCase?.clientName ?? "Client"}
        </Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        {showAlert && (
          <Alert
            variant="danger"
            dismissible
            onClose={() => setShowAlert(false)}
          >
            <Alert.Heading>Unsaved Changes!</Alert.Heading>
            <p>
              If you close this, the entered case information will not be saved.
            </p>
            <div className="d-flex justify-content-end">
              <Button
                onClick={() => handleClose()} // confirm close
                variant="outline-danger"
                size="sm"
              >
                Discard & Close
              </Button>
            </div>
          </Alert>
        )}

        {selectedCase && (
          <>
            <p>
              <strong>Lawyer:</strong> {selectedCase.lawyerName}
            </p>
            <Form onSubmit={handleSubmit}>
              {/* Case Title */}
              <Form.Group className="mb-3">
                <Form.Label>Case Title</Form.Label>
                <Form.Control
                  type="text"
                  name="caseTitle"
                  placeholder="Enter case title"
                  required
                />
              </Form.Group>

              {/* Case Description */}
              <Form.Group className="mb-3">
                <Form.Label>Case Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="caseDescription"
                  placeholder="Enter case description"
                />
              </Form.Group>

              {/* Status Dropdown */}
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <br />
                <DropdownButton
                  id="dropdown-status"
                  title={status}
                  variant="secondary"
                  onSelect={handleStatusSelect}
                >
                  <Dropdown.Item eventKey="Pending">Pending</Dropdown.Item>
                  <Dropdown.Item eventKey="Active">Active</Dropdown.Item>
                  <Dropdown.Item eventKey="Closed">Closed</Dropdown.Item>
                </DropdownButton>
              </Form.Group>

              {/* Save Button */}
              <Button variant="success" type="submit">
                Save Case
              </Button>
            </Form>
          </>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default AssignCase;