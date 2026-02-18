// src/features/Admin/Pages/Manage User/Register/components/pagetwoform.tsx
import React from "react";
import { Form, Row, Col, InputGroup } from "react-bootstrap";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import CustomDropdown from "./Option";

type Role = "admin" | "lawyer" | "client";

type Page2FormProps = {
  username: string;
  setUsername: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  email: string;
  setEmail: (val: string) => void;
  role: Role | "";
  setRole: (val: Role) => void;
};

const Page2Form: React.FC<Page2FormProps> = ({
  username,
  setUsername,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  email,
  setEmail,
  role,
  setRole,
}) => {
  return (
    <Form>
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="formUsername">
            <Form.Label>Username</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group controlId="formPassword">
            <Form.Label>Password</Form.Label>
            <InputGroup>
              <Form.Control
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <InputGroup.Text
                onClick={() => setShowPassword(!showPassword)}
                style={{ cursor: "pointer" }}
              >
                {/* Call the icon functions directly to satisfy TypeScript */}
                {showPassword ? FaEyeSlash({}) : FaEye({})}
              </InputGroup.Text>
            </InputGroup>
          </Form.Group>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="formEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group controlId="formRole">
            <Form.Label>Role</Form.Label>
            <CustomDropdown
              title={role || "Select role"}
              options={[
                { label: "Admin", value: "admin" },
                { label: "Lawyer", value: "lawyer" },
                { label: "Client", value: "client" },
              ]}
              onSelect={(val) => setRole(val as Role)}
            />
          </Form.Group>
        </Col>
      </Row>
    </Form>
  );
};

export default Page2Form;