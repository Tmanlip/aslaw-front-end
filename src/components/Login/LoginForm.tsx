import React, { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import { colors } from "../../constant/color";
import EmailConfirm from "../../pages/ForgotPassword/MFA";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";  // ✅ import

type LoginFormProps = {
  onLoginSuccess?: (
    role: "admin" | "client" | "lawyer",
    message: string
  ) => void;
};

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const { login } = useAuth(); // ✅ global auth
  const navigate = useNavigate(); // ✅ router navigation

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertVariant, setAlertVariant] = useState<"success" | "danger">(
    "success"
  );
  const [showForgotPasswordPage, setForgotPasswordPage] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Hardcoded users for testing
    const users = [
      { email: "admin@example.com", password: "password123", role: "admin" },
      { email: "client@example.com", password: "password123", role: "client" },
      { email: "lawyer@example.com", password: "password123", role: "lawyer" },
    ];

    const foundUser = users.find(
      (user) => user.email === email && user.password === password
    );

    if (foundUser) {
      const successMessage = `Login successful! Welcome ${foundUser.role}`;
      setAlertVariant("success");
      setAlertMessage(successMessage);

      // ✅ update global auth
      login(foundUser.role as "admin" | "client" | "lawyer");

      // ✅ redirect to dashboard
      if (foundUser.role === "admin") navigate("/admin/dashboard");
      if (foundUser.role === "client") navigate("/client/dashboard");
      if (foundUser.role === "lawyer") navigate("/lawyer/dashboard");

      // optional callback
      onLoginSuccess?.(
        foundUser.role as "admin" | "client" | "lawyer",
        successMessage
      );
    } else {
      setAlertVariant("danger");
      setAlertMessage("Invalid username or password");
    }
  };

  // ✅ Show ForgotPassword instead of Login if triggered
  if (showForgotPasswordPage) {
    return <EmailConfirm />;
  }

  return (
    <Form onSubmit={handleSubmit}>
      {alertMessage && (
        <Alert
          variant={alertVariant}
          onClose={() => setAlertMessage(null)}
          dismissible
        >
          {alertMessage}
        </Alert>
      )}

      {/* Email */}
      <Form.Group className="mb-3" controlId="formUsername">
        <Form.Label>Email Address</Form.Label>
        <Form.Control
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Form.Text muted>
          Please use the email associated with your account.
        </Form.Text>
      </Form.Group>

      {/* Password */}
      <Form.Group className="mb-3" controlId="formPassword">
        <Form.Label>Password</Form.Label>
        <Form.Control
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Form.Text muted>
          Your password must be 8–20 characters long and contain letters and numbers.
        </Form.Text>
      </Form.Group>

      {/* Remember me & Forgot password */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Form.Check type="checkbox" id="rememberMe" label="Remember me" />
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setForgotPasswordPage(true);
          }}
          style={{
            fontSize: "14px",
            color: colors.gold6 || "#3b82f6",
            textDecoration: "none",
            fontWeight: "500",
          }}
        >
          Forgot password?
        </a>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="outline-warning"
        style={{ width: "100%", fontWeight: 600 }}
      >
        Sign In
      </Button>
    </Form>
  );
};

export default LoginForm;