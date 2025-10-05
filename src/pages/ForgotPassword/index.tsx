import React, { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import InputGroup from "react-bootstrap/InputGroup";
import FormText from "react-bootstrap/FormText";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { colors } from "../../constant/color";
// Eye icons
import { FaEye, FaEyeSlash } from "react-icons/fa";

// Example image (replace with your own path)
import aspic from "../../assets/pics/logo-landscape.png";

const ForgotPasswordPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    alert("Password reset successfully!");
  };

  return (
    <Container
      fluid
      className="d-flex align-items-center justify-content-center min-vh-100"
      style={{ backgroundColor: colors.gold6 }} // ✅ use imported color here
    >
      <Row className="w-100 justify-content-center">
        <Col xs={12} md={6} lg={5}>
          {/* Image */}
          <div className="text-center mb-4">
            <img
              src={aspic}
              alt="Forgot Password"
              style={{ maxWidth: "200px", height: "auto" }}
            />
            <h3 className="mt-3">Forgot Password</h3>
            <p className="text-muted">Reset your account password below.</p>
          </div>

          {/* Form */}
          <Form onSubmit={handleSubmit} className="p-4 rounded shadow bg-white">
            {/* Username */}
            <Form.Group className="mb-3" controlId="formUsername">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <FormText muted>Enter your registered username.</FormText>
            </Form.Group>

            {/* New Password */}
            <Form.Group className="mb-3" controlId="formNewPassword">
              <Form.Label>New Password</Form.Label>
              <InputGroup>
                <Form.Control
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword
                    ? (FaEyeSlash({}) as React.ReactElement)
                    : (FaEye({}) as React.ReactElement)
                  }

                </Button>
              </InputGroup>
              <FormText muted>Must be at least 8 characters long.</FormText>
            </Form.Group>

            {/* Confirm Password */}
            <Form.Group className="mb-3" controlId="formConfirmPassword">
              <Form.Label>Confirm Password</Form.Label>
              <InputGroup>
                <Form.Control
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword
                    ? (FaEyeSlash({}) as React.ReactElement)
                    : (FaEye({}) as React.ReactElement)
                  }

                </Button>
              </InputGroup>
            </Form.Group>

            {/* Submit */}
            <Button variant="primary" type="submit" className="w-100">
              Reset Password
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default ForgotPasswordPage;
