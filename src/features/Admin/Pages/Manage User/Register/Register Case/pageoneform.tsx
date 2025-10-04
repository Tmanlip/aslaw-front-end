// src/components/Page1Form.tsx
import React from "react";
import { Form, Row, Col } from "react-bootstrap";
import CustomDropdown from "../components/Option";

type Page1FormProps = {
  caseName: string;
  setCaseName: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  lawyer: string;
  setLawyer: (val: string) => void;
};

const Page1Form: React.FC<Page1FormProps> = ({
  caseName,
  setCaseName,
  description,
  setDescription,
  lawyer,
  setLawyer,
}) => {
  return (
    <Form>
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="formCaseName">
            <Form.Label>Case Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter case name"
              value={caseName}
              onChange={(e) => setCaseName(e.target.value)}
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group controlId="formLawyer">
            <Form.Label>Lawyer</Form.Label>
            <CustomDropdown
              title={lawyer || "Select lawyer"}
              options={["Lawyer A", "Lawyer B", "Lawyer C"]}
              onSelect={(val) => setLawyer(val)}
            />
          </Form.Group>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={12}>
          <Form.Group controlId="formDescription">
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
