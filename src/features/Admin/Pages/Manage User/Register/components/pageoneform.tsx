// src/components/Page1Form.tsx
import React from "react";
import { Form, Row, Col } from "react-bootstrap";
import CustomDropdown from "./Option";

type Page1FormProps = {
  fullName: string;
  setFullName: (val: string) => void;
  age: string;
  setAge: (val: string) => void;
  identification: string;
  setIdentification: (val: string) => void;
  maritalStatus: string;
  setMaritalStatus: (val: string) => void;
};

const Page1Form: React.FC<Page1FormProps> = ({
  fullName,
  setFullName,
  age,
  setAge,
  identification,
  setIdentification,
  maritalStatus,
  setMaritalStatus,
}) => {
  return (
    <Form>
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="formFullName">
            <Form.Label>Full Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group controlId="formAge">
            <Form.Label>Age</Form.Label>
            <Form.Control
              type="number"
              placeholder="Enter age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </Form.Group>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="formIdentification">
            <Form.Label>Identification Number</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter ID number"
              value={identification}
              onChange={(e) => setIdentification(e.target.value)}
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group controlId="formMaritalStatus">
            <Form.Label>Marital Status</Form.Label>
            <CustomDropdown
              title={maritalStatus || "Select status"}
              options={["Single", "Married", "Divorced", "Widowed"]}
              onSelect={(val) => setMaritalStatus(val)}
            />
          </Form.Group>
        </Col>
      </Row>
    </Form>
  );
};

export default Page1Form;