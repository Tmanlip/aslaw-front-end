// src/components/AddCaseOffcanvas.tsx
import React, { useState, useEffect } from "react";
import Offcanvas from "react-bootstrap/Offcanvas";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import Alert from "react-bootstrap/Alert";
import axiosUser from "../../../../../../api/axiosUser";
import "./assignCase.css";

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

type CaseType = "Litigation" | "Criminal" | "Corporate";

const getDefaultExpectedPayments = (caseType: CaseType) => {
  switch (caseType) {
    case "Criminal":
      return { initial: "1200", first: "1800", second: "2000", third: "2200", final: "2800" };
    case "Corporate":
      return { initial: "3000", first: "4500", second: "5000", third: "5500", final: "7000" };
    default:
      return { initial: "1500", first: "2500", second: "3000", third: "3000", final: "4000" };
  }
};

const AddCaseOffcanvas: React.FC<AddCaseOffcanvasProps> = ({
  show,
  handleClose,
  selectedCase,
  onCaseAssigned,
}) => {
  const [status, setStatus] = useState("Pending");
  const [caseType, setCaseType] = useState<CaseType>("Litigation");
  const [showAlert, setShowAlert] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAlert, setSubmitAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null);
  const [expectedPayments, setExpectedPayments] = useState(getDefaultExpectedPayments("Litigation"));

  const handleResetExpectedPayments = () => {
    setExpectedPayments(getDefaultExpectedPayments(caseType));
  };

  useEffect(() => {
    const fetchLawyers = async () => {
      try {
        const res = await axiosUser.get<Lawyer[]>(`/users`);
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
    if (!selectedCase || !selectedLawyer || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitAlert(null);

    try {
      const res = await axiosUser.post(`/registercases`, {
        title: (e.target as HTMLFormElement).caseTitle.value,
        caseType,
        description: (e.target as HTMLFormElement).caseDescription.value,
        clientID: selectedCase.clientFirmID,
        lawyerID: selectedLawyer.firmID,
        expected_initial_payment: Number(expectedPayments.initial || 0),
        expected_first_payment: Number(expectedPayments.first || 0),
        expected_second_payment: Number(expectedPayments.second || 0),
        expected_third_payment: Number(expectedPayments.third || 0),
        expected_final_payment: Number(expectedPayments.final || 0),
      });

      setSubmitAlert({
        variant: "success",
        message: "Case created successfully!",
      });

      // Notify parent table to update
      if (onCaseAssigned) onCaseAssigned(res.data.caseId);

      setTimeout(() => {
        setIsSubmitting(false);
        handleClose();
      }, 650);
    } catch (err: any) {
      console.error(err);
      setSubmitAlert({
        variant: "danger",
        message: "Failed to create case: " + (err.response?.data?.error || err.message),
      });
      setIsSubmitting(false);
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
      className="assign-case-offcanvas"
    >
      <Offcanvas.Header closeButton className="assign-case-header">
        <Offcanvas.Title className="assign-case-title-wrap">
          <h2>Assign Case</h2>
          <p>
            Add a new case for <strong>{selectedCase?.clientName ?? "Client"}</strong>
          </p>
        </Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body className="assign-case-body">
        {showAlert && (
          <Alert
            variant="danger"
            dismissible
            onClose={() => setShowAlert(false)}
            className="assign-case-alert"
          >
            <Alert.Heading>Unsaved Changes</Alert.Heading>
            <p>If you close this panel, entered case information will be lost.</p>
            <div className="d-flex justify-content-end">
              <Button onClick={() => handleClose()} variant="outline-danger" size="sm">
                Discard and Close
              </Button>
            </div>
          </Alert>
        )}

        {submitAlert && (
          <Alert
            variant={submitAlert.variant}
            dismissible
            onClose={() => setSubmitAlert(null)}
            className="assign-case-alert"
          >
            {submitAlert.message}
          </Alert>
        )}

        {selectedCase && (
          <div className="assign-case-card">
            <div className="assign-case-card-header">
              <div>
                <h3>Case Details</h3>
                <p>Fill in case information, assignment, and expected payment phases.</p>
              </div>
              <span className="assign-case-badge">Step 1 of 1</span>
            </div>

            <div className="assign-case-card-body">
              <Form onSubmit={handleSubmit} className="assign-case-form">
                <Form.Group className="mb-3">
                  <Form.Label>Case Title</Form.Label>
                  <Form.Control
                    type="text"
                    name="caseTitle"
                    placeholder="Enter case title"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Case Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="caseDescription"
                    placeholder="Enter case description"
                  />
                </Form.Group>

                <div className="assign-case-inline-grid">
                  <Form.Group className="mb-3">
                    <Form.Label>Status</Form.Label>
                    <DropdownButton
                      id="dropdown-status"
                      title={status}
                      variant="light"
                      onSelect={handleStatusSelect}
                      className="assign-case-dropdown"
                    >
                      <Dropdown.Item eventKey="Pending">Pending</Dropdown.Item>
                      <Dropdown.Item eventKey="Active">Active</Dropdown.Item>
                      <Dropdown.Item eventKey="Closed">Archived</Dropdown.Item>
                    </DropdownButton>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Case Type</Form.Label>
                    <Form.Select
                      value={caseType}
                      onChange={(e) => {
                        setCaseType(e.target.value as CaseType);
                      }}
                    >
                      <option value="Litigation">Litigation</option>
                      <option value="Criminal">Criminal</option>
                      <option value="Corporate">Corporate</option>
                    </Form.Select>
                  </Form.Group>
                </div>

                <Form.Group className="mb-3">
                  <Form.Label>Assign Lawyer</Form.Label>
                  <DropdownButton
                    id="dropdown-lawyer"
                    title={selectedLawyer?.name ?? "Select Lawyer"}
                    variant="light"
                    className="assign-case-dropdown"
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

                <div className="assign-case-section-title-wrap">
                  <div className="assign-case-section-title">Expected Payment Phases (RM)</div>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    type="button"
                    onClick={handleResetExpectedPayments}
                  >
                    Reset to defaults
                  </Button>
                </div>

                <div className="assign-case-payment-grid">
                  <Form.Group className="mb-3">
                    <Form.Label>Initial Phase</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      step="0.01"
                      value={expectedPayments.initial}
                      onChange={(e) => setExpectedPayments((prev) => ({ ...prev, initial: e.target.value }))}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>First Phase</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      step="0.01"
                      value={expectedPayments.first}
                      onChange={(e) => setExpectedPayments((prev) => ({ ...prev, first: e.target.value }))}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Second Phase</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      step="0.01"
                      value={expectedPayments.second}
                      onChange={(e) => setExpectedPayments((prev) => ({ ...prev, second: e.target.value }))}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Third Phase</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      step="0.01"
                      value={expectedPayments.third}
                      onChange={(e) => setExpectedPayments((prev) => ({ ...prev, third: e.target.value }))}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Final Phase</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      step="0.01"
                      value={expectedPayments.final}
                      onChange={(e) => setExpectedPayments((prev) => ({ ...prev, final: e.target.value }))}
                    />
                  </Form.Group>
                </div>

                <div className="assign-case-footer">
                  <Button variant="success" type="submit" className="assign-case-save-btn" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Saving...
                      </>
                    ) : (
                      "Save Case"
                    )}
                  </Button>
                </div>
              </Form>
            </div>
          </div>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default AddCaseOffcanvas;