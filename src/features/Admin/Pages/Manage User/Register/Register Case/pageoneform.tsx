import React from "react";
import { Form, Row, Col } from "react-bootstrap";
import CustomDropdown from "../components/Option";
import type { User } from "./index";

type Page1FormProps = {
  caseName: string;
  setCaseName: (val: string) => void;
  caseType: "Litigation" | "Criminal" | "Corporate";
  setCaseType: (val: "Litigation" | "Criminal" | "Corporate") => void;
  expectedPayments: {
    initial: string;
    first: string;
    second: string;
    third: string;
    final: string;
  };
  setExpectedPayments: React.Dispatch<React.SetStateAction<{
    initial: string;
    first: string;
    second: string;
    third: string;
    final: string;
  }>>;
  onResetExpectedPayments: () => void;

  description: string;
  setDescription: (val: string) => void;

  lawyer: User | null;
  setLawyer: (val: User | null) => void;
  lawyerOptions: User[];

  client: User | null;
  setClient: (val: User | null) => void;
  clientOptions: User[];
};

const Page1Form: React.FC<Page1FormProps> = ({
  caseName,
  setCaseName,
  caseType,
  setCaseType,
  expectedPayments,
  setExpectedPayments,
  onResetExpectedPayments,
  description,
  setDescription,
  lawyer,
  setLawyer,
  lawyerOptions,
  client,
  setClient,
  clientOptions,
}) => {
  return (
    <Form className="admin-register-case-form">
      <div className="admin-register-case-section-title">Case Details</div>
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Case Name <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter case name"
              value={caseName}
              onChange={(e) => setCaseName(e.target.value)}
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group>
            <Form.Label>Case Type <span className="text-danger">*</span></Form.Label>
            <Form.Select
              value={caseType}
              onChange={(e) => setCaseType(e.target.value as "Litigation" | "Criminal" | "Corporate")}
            >
              <option value="Litigation">Litigation</option>
              <option value="Criminal">Criminal</option>
              <option value="Corporate">Corporate</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <div className="admin-register-case-section-title">Assign Parties</div>
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Lawyer <span className="text-danger">*</span></Form.Label>
            <CustomDropdown
              title={lawyer ? `${lawyer.name} (${lawyer.firmID})` : "Select lawyer"}
              options={lawyerOptions.map((l) => ({
                key: l.id,
                label: `${l.name} (${l.firmID})`,
                value: l.firmID,
              }))}
              onSelect={(firmID) =>
                setLawyer(lawyerOptions.find((l) => l.firmID === firmID) || null)
              }
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group>
            <Form.Label>Client <span className="text-danger">*</span></Form.Label>
            <CustomDropdown
              title={client ? `${client.name} (${client.firmID})` : "Select client"}
              options={clientOptions.map((c) => ({
                key: c.id,
                label: `${c.name} (${c.firmID})`,
                value: c.firmID,
              }))}
              onSelect={(firmID) =>
                setClient(clientOptions.find((c) => c.firmID === firmID) || null)
              }
            />
          </Form.Group>
        </Col>
      </Row>

      <div className="admin-register-case-section-title">Expected Payment Plan</div>
      <Row className="mb-3">
        <Col md={12}>
          <Form.Group>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <Form.Label className="mb-0">Expected Payment Phases (RM)</Form.Label>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={onResetExpectedPayments}
              >
                Reset to defaults
              </button>
            </div>
            <Row>
              <Col md={4} className="mb-2">
                <Form.Label>Initial Phase</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter initial phase amount"
                  value={expectedPayments.initial}
                  onChange={(e) =>
                    setExpectedPayments((prev) => ({ ...prev, initial: e.target.value }))
                  }
                />
              </Col>
              <Col md={4} className="mb-2">
                <Form.Label>First Phase</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter first phase amount"
                  value={expectedPayments.first}
                  onChange={(e) =>
                    setExpectedPayments((prev) => ({ ...prev, first: e.target.value }))
                  }
                />
              </Col>
              <Col md={4} className="mb-2">
                <Form.Label>Second Phase</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter second phase amount"
                  value={expectedPayments.second}
                  onChange={(e) =>
                    setExpectedPayments((prev) => ({ ...prev, second: e.target.value }))
                  }
                />
              </Col>
              <Col md={6} className="mb-2">
                <Form.Label>Third Phase</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter third phase amount"
                  value={expectedPayments.third}
                  onChange={(e) =>
                    setExpectedPayments((prev) => ({ ...prev, third: e.target.value }))
                  }
                />
              </Col>
              <Col md={6} className="mb-2">
                <Form.Label>Final Phase</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter final phase amount"
                  value={expectedPayments.final}
                  onChange={(e) =>
                    setExpectedPayments((prev) => ({ ...prev, final: e.target.value }))
                  }
                />
              </Col>
            </Row>
          </Form.Group>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={12}>
          <Form.Group>
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Enter case description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Form.Group>
        </Col>
      </Row>
    </Form>
  );
};

export default Page1Form;
