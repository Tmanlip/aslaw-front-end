import React, { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";

const EmailConfirm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (email) {
      setAlertMessage(
        `✅ A password reset link has been sent to ${email}. Please check your inbox.`
      );
      setEmail("");
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {/* ✅ Bootstrap Alert */}
      {alertMessage && (
        <Alert
          variant="success"
          onClose={() => setAlertMessage(null)}
          dismissible
        >
          <Alert.Heading>Password Reset Email Sent!</Alert.Heading>
          <p>{alertMessage}</p>
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
          We’ll send a password reset link to this email if it exists in our
          system.
        </Form.Text>
      </Form.Group>

      {/* ✅ Outline Bootstrap Button */}
      <Button
        type="submit"
        variant="outline-warning"
        style={{ width: "100%", fontWeight: 600 }}
      >
        Send Reset Link
      </Button>
    </Form>
  );
};

export default EmailConfirm;
