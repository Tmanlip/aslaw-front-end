import React from "react";
import { Form, Row, Col } from "react-bootstrap";
import CustomDropdown from "../components/Option";
import { User } from "./index";

type Page1FormProps = {
  caseName: string;
  setCaseName: (val: string) => void;

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
    <Form>
      {/* Case Name */}
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Case Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter case name"
              value={caseName}
              onChange={(e) => setCaseName(e.target.value)}
            />
          </Form.Group>
        </Col>
      </Row>

      {/* Lawyer & Client */}
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Lawyer</Form.Label>
           <CustomDropdown
  title={lawyer ? `${lawyer.name} (${lawyer.firmID})` : "Select lawyer"}
  options={lawyerOptions.map((l) => ({
    key: l.id,
    label: `${l.name} (${l.firmID})`,
    value: l.firmID, // <- send firmID
  }))}
  onSelect={(firmID) =>
    setLawyer(lawyerOptions.find((l) => l.firmID === firmID) || null)
  }
/>
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group>
            <Form.Label>Client</Form.Label>
<CustomDropdown
  title={client ? `${client.name} (${client.firmID})` : "Select client"}
  options={clientOptions.map((c) => ({
    key: c.id,
    label: `${c.name} (${c.firmID})`,
    value: c.firmID, // <- send firmID
  }))}
  onSelect={(firmID) =>
    setClient(clientOptions.find((c) => c.firmID === firmID) || null)
  }
/>
          </Form.Group>
        </Col>
      </Row>

      {/* Description */}
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