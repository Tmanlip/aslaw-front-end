// src/components/Page1Form.tsx
import React from "react";
import { Form, Row, Col } from "react-bootstrap";
import CustomDropdown from "./Option";

type Gender = "Male" | "Female";
type MaritalStatus = "Single" | "Married" | "Divorce";

type Page1FormProps = {
  fullName: string;
  setFullName: (val: string) => void;

  age: string;
  setAge: (val: string) => void;

  gender: Gender | "";
  setGender: (val: Gender) => void;

  identification: string;
  setIdentification: (val: string) => void;

  maritalStatus: MaritalStatus | "";
  setMaritalStatus: (val: MaritalStatus) => void;

  phoneNumber: string;
  setPhoneNumber: (val: string) => void;

  address: string;
  setAddress: (val: string) => void;
};

const Page1Form: React.FC<Page1FormProps> = ({
  fullName,
  setFullName,
  age,
  setAge,
  gender,
  setGender,
  identification,
  setIdentification,
  maritalStatus,
  setMaritalStatus,
  phoneNumber,
  setPhoneNumber,
  address,
  setAddress,
}) => {
  return (
    <Form>
      {/* Row 1 */}
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

      {/* Row 2 */}
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="formGender">
            <Form.Label>Gender</Form.Label>
            <CustomDropdown
              title={gender || "Select gender"}
              options={[
                { label: "Male", value: "Male" },
                { label: "Female", value: "Female" },
              ]}
              onSelect={(val) => setGender(val as Gender)}
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group controlId="formPhoneNumber">
            <Form.Label>Phone Number</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </Form.Group>
        </Col>
      </Row>

      {/* Row 3 */}
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
              options={[
                { label: "Single", value: "Single" },
                { label: "Married", value: "Married" },
                { label: "Divorced", value: "Divorce" },
              ]}
              onSelect={(val) => setMaritalStatus(val as MaritalStatus)}
            />
          </Form.Group>
        </Col>
      </Row>

      {/* Row 4 */}
      <Row className="mb-3">
        <Col>
          <Form.Group controlId="formAddress">
            <Form.Label>Home Address</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Enter home address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </Form.Group>
        </Col>
      </Row>
    </Form>
  );
};

export default Page1Form;