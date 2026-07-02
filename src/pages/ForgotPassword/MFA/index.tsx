import React, { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import axios from "axios";
import { resolveApiBaseUrl } from "../../../api/resolveApiBaseUrl";

type EmailConfirmProps = {
  initialEmail?: string;
};

const EmailConfirm: React.FC<EmailConfirmProps> = ({ initialEmail = "" }) => {
  const apiBaseUrl = resolveApiBaseUrl();
  const [email, setEmail] = useState(initialEmail);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertVariant, setAlertVariant] = useState<"success" | "danger">("success");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAlertMessage(null);

    try {
      const response = await axios.post(`${apiBaseUrl}/forgot-password`, {
        email: email
      });

      setAlertMessage(`✅ ${response.data.message}`);
      setAlertVariant("success");
      setEmail(""); // clear input on success
    } catch (error: any) {
      setAlertMessage("❌ Something went wrong. Please try again.");
      setAlertVariant("danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {/* Alert */}
      {alertMessage && (
        <Alert
          variant={alertVariant}
          onClose={() => setAlertMessage(null)}
          dismissible
        >
          {alertMessage}
        </Alert>
      )}

      {/* Email Input */}
      <Form.Group className="mb-3" controlId="forgotPasswordEmail">
        <Form.Label>Email Address</Form.Label>
        <Form.Control
          type="email"
          placeholder="Enter your registered email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Form.Text muted>
          We’ll send a password reset link to this email if it exists in our system.
        </Form.Text>
      </Form.Group>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="outline-warning"
        style={{ width: "100%", fontWeight: 600 }}
        disabled={loading}
      >
        {loading ? "Sending..." : "Send Reset Link"}
      </Button>
    </Form>
  );
};

export default EmailConfirm;