import React, { useState, useEffect } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import InputGroup from "react-bootstrap/InputGroup";
import FormText from "react-bootstrap/FormText";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { colors } from "../../constant/color";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // ✅ removed IconType
import aspic from "../../assets/pics/logo-landscape.png";
import axios from "axios";
import Alert from "react-bootstrap/Alert";
import { resolveApiBaseUrl } from "../../api/resolveApiBaseUrl";

const ForgotPasswordPage: React.FC = () => {
  const apiBaseUrl = resolveApiBaseUrl();
  const [emailState, setEmailState] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [variant, setVariant] = useState<"success" | "danger">("success");
  const [loading, setLoading] = useState(false);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    if (email) setEmailState(email);
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match!");
      setVariant("danger");
      return;
    }

    if (!token) {
      setMessage("Invalid reset link.");
      setVariant("danger");
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${apiBaseUrl}/reset-password`,
        {
          email: emailState,
          token: token,
          password: newPassword,
          password_confirmation: confirmPassword,
        }
      );

      setMessage("Password reset successful! Redirecting to login...");
      setVariant("success");

      setTimeout(() => {
        navigate("/", { replace: true }); // redirect to HomePage/login
      }, 1500);
    } catch (error: any) {
      setMessage("Reset failed. Please try again.");
      setVariant("danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      fluid
      className="d-flex align-items-center justify-content-center min-vh-100"
      style={{ backgroundColor: colors.gold6 }}
    >
      <Row className="w-100 justify-content-center">
        <Col xs={12} md={6} lg={5}>
          {/* Logo */}
          <div className="text-center mb-4">
            <img
              src={aspic}
              alt="Forgot Password"
              style={{ maxWidth: "200px", height: "auto" }}
            />
            <h3 className="mt-3">Forgot Password</h3>
            <p className="text-muted">Reset your account password below.</p>
          </div>

          {/* Alert */}
          {message && (
            <Alert variant={variant} onClose={() => setMessage(null)} dismissible>
              {message}
            </Alert>
          )}

          {/* Form */}
          <Form onSubmit={handleSubmit} className="p-4 rounded shadow bg-white">
            {/* Email */}
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={emailState} readOnly />
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
                  type="button"
                >
                  {showNewPassword ? FaEyeSlash({}) : FaEye({})}
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
                  type="button"
                >
                  {showConfirmPassword ? FaEyeSlash({}) : FaEye({})}
                </Button>
              </InputGroup>
            </Form.Group>

            {/* Submit */}
            <Button variant="primary" type="submit" className="w-100" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default ForgotPasswordPage;