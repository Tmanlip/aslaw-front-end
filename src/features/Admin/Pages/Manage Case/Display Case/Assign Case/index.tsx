// src/components/AddCaseOffcanvas.tsx
import React, { useState, useEffect } from "react";
import Offcanvas from "react-bootstrap/Offcanvas";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import Alert from "react-bootstrap/Alert";
import axiosUser from "../../../../../../api/axiosUser";

interface CaseRecord {
  id: number;
  clientName?: string;
  clientFirmID?: string;
}

interface Lawyer {
  id: number;
  name: string;
  firmID: string;
}

interface AddCaseOffcanvasProps {
  show: boolean;
  handleClose: () => void;
  selectedCase: CaseRecord | null;
  onCaseAssigned?: (caseId: number) => void;
}

const AddCaseOffcanvas: React.FC<AddCaseOffcanvasProps> = ({
  show,
  handleClose,
  selectedCase,
  onCaseAssigned,
}) => {
  const [status, setStatus] = useState("Pending");
  const [showAlert, setShowAlert] = useState(false);
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null);

  useEffect(() => {
    const fetchLawyers = async () => {
      try {
        const res = await axiosUser.get<Lawyer[]>(`${process.env.REACT_APP_API_URL}/users`);
        const allLawyers = res.data.filter((u: any) => u.role === "lawyer");
        setLawyers(allLawyers);
        if (allLawyers.length > 0) setSelectedLawyer(allLawyers[0]);
      } catch (err) {
        console.error("Failed to fetch lawyers", err);
      }
    };

    fetchLawyers();
  }, []);

  const handleStatusSelect = (eventKey: string | null) => {
    if (eventKey) setStatus(eventKey);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !selectedLawyer) return;

    try {
      const res = await axiosUser.post(`${process.env.REACT_APP_API_URL}/registercases`, {
        title: (e.target as HTMLFormElement).caseTitle.value,
        description: (e.target as HTMLFormElement).caseDescription.value,
        clientID: selectedCase.clientFirmID,
        lawyerID: selectedLawyer.firmID,
      });

      alert("Case created successfully!");

      // Notify parent table to update
      if (onCaseAssigned) onCaseAssigned(res.data.caseId);

      handleClose();
    } catch (err: any) {
      console.error(err);
      alert("Failed to create case: " + (err.response?.data?.error || err.message));
    }
  };

  const handleTryClose = () => {
    setShowAlert(true);
  };

  return (
    <Offcanvas
      show={show}
      onHide={handleTryClose}
      placement="end"
      backdrop="static"
      keyboard={false}
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
            <p>If you close this, the entered case information will not be saved.</p>
            <div className="d-flex justify-content-end">
              <Button
                onClick={() => handleClose()}
                variant="outline-danger"
                size="sm"
              >
                Discard & Close
              </Button>
            </div>
          </Alert>
        )}

        {selectedCase && (
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
                <Dropdown.Item eventKey="Closed">Archived</Dropdown.Item>
              </DropdownButton>
            </Form.Group>

            {/* Lawyer Dropdown */}
            <Form.Group className="mb-3">
              <Form.Label>Assign Lawyer</Form.Label>
              <br />
              <DropdownButton
                id="dropdown-lawyer"
                title={selectedLawyer?.name ?? "Select Lawyer"}
              >
                {lawyers.map((lawyer) => (
                  <Dropdown.Item
                    key={lawyer.id}
                    onClick={() => setSelectedLawyer(lawyer)}
                  >
                    {lawyer.name}
                  </Dropdown.Item>
                ))}
              </DropdownButton>
            </Form.Group>

            {/* Save Button */}
            <Button variant="success" type="submit">
              Save Case
            </Button>
          </Form>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default AddCaseOffcanvas;