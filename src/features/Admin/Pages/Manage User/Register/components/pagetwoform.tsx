// src/components/Page2Form.tsx
import React from "react";
import { Form, Row, Col, InputGroup } from "react-bootstrap";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import CustomDropdown from "./Option";

type Page2FormProps = {
  username: string;
  setUsername: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  email: string;
  setEmail: (val: string) => void;
  role: string;
  setRole: (val: string) => void;
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
                {showPassword
                  ? (FaEyeSlash({}) as React.ReactElement)
                  : (FaEye({}) as React.ReactElement)
                }

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
              options={["Admin", "Staff", "Student"]}
              onSelect={(val) => setRole(val)}
            />
          </Form.Group>
        </Col>
      </Row>
    </Form>
  );
};

export default Page2Form;
