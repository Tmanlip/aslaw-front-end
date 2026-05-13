import React, { useEffect, useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import Spinner from "react-bootstrap/Spinner";
import Modal from "react-bootstrap/Modal";
import { colors } from "../../constant/color";
import EmailConfirm from "../../pages/ForgotPassword/MFA";
import { useAuth } from "../../context/AuthContext";
import AuthMemory from "../../data/authMemory";
import PATH from "../../constant/paths";

const resolvedApiUrl =
  process.env.REACT_APP_API_URL ||
  (process.env.REACT_APP_BASE_URL
    ? `${process.env.REACT_APP_BASE_URL.replace(/\/+$/, "")}/api`
    : "") ||
  "/api";

const API_URL = resolvedApiUrl.replace(/\/+$/, "");

type LoginFormProps = {
  onLoginSuccess?: (
    role: "admin" | "junioradmin" | "client" | "lawyer",
    message: string,
    options?: {
      redirectTo?: string;
      forcePasswordReset?: boolean;
    }
  ) => void;
};

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertVariant, setAlertVariant] = useState<"success" | "danger" | "warning">(
    "success"
  );
  const [showForgotPasswordPage, setForgotPasswordPage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLockedModal, setShowLockedModal] = useState(false);

  useEffect(() => {
    const pingBackend = async () => {
      const pingUrl = `${API_URL}/ping`;
      try {
        const response = await fetch(pingUrl, {
          method: "GET",
          headers: { Accept: "application/json" },
        });
        const responseText = await response.text();

        console.log("[API PING] URL:", pingUrl);
        console.log("[API PING] Status:", response.status);

        if (!response.ok) {
          console.error("[API PING] Failed response body:", responseText);
          return;
        }

        try {
          const data = responseText ? JSON.parse(responseText) : {};
          console.log("[API PING] Success:", data);
        } catch {
          console.log("[API PING] Success (non-JSON body):", responseText);
        }
      } catch (error) {
        console.error("[API PING] Request failed:", error);
      }
    };

    void pingBackend();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password, remember: rememberMe }),
      });

      const responseText = await response.text();
      let data: any = {};

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = { message: responseText };
        }
      }

      if (!response.ok) {
        const error: any = new Error(data.message || "Login failed");
        error.status = response.status;
        error.code = data.code;
        error.resetRequired = Boolean(data.reset_required);
        throw error;
      }

      console.log("LOGIN SUCCESS:", data);

      const normalizedRole = String(data.role || "").toLowerCase() as
        | "admin"
        | "junioradmin"
        | "client"
        | "lawyer";

      const resolveMyProfilePath = (
        role: "admin" | "junioradmin" | "client" | "lawyer"
      ): string => {
        if (role === "admin" || role === "junioradmin") {
          return PATH.ADMIN.MY_PROFILE;
        }

        if (role === "client") {
          return PATH.CLIENT.MY_PROFILE;
        }

        return PATH.LAWYER.MY_PROFILE;
      };

      if (!["admin", "junioradmin", "client", "lawyer"].includes(normalizedRole)) {
        throw new Error("Invalid user role returned from server");
      }

      const token =
        data.token ||
        data.access_token ||
        data.accessToken ||
        data.jwt ||
        null;

      const {
        token: _token,
        access_token: _accessToken,
        accessToken: _accessTokenCamel,
        jwt: _jwt,
        message: _message,
        ...responseUserFields
      } = data;

      const user = data.user || {
        ...responseUserFields,
        role: normalizedRole,
        email: data.email || email,
        name: data.name || data.username,
      };

      const mustChangePassword = Boolean(
        data.must_change_password ?? user?.must_change_password
      );

      if (mustChangePassword) {
        user.must_change_password = true;
      }

      // Check if user account is archived
      if (user.status && String(user.status).toLowerCase() === 'archived') {
        AuthMemory.setAuth(token, user, rememberMe);
        login(normalizedRole, user, rememberMe);
        
        setAlertVariant("danger");
        setAlertMessage("Your account has been deactivated. You can only log out. Please contact the administrator if you believe this is a mistake.");
        
        // Don't redirect - let user stay on login page where they can logout
        onLoginSuccess?.(normalizedRole, "Account archived");
        return;
      }

      AuthMemory.setAuth(token, user, rememberMe);

      // Update your global auth context
      login(normalizedRole, user, rememberMe);

      if (mustChangePassword) {
        const promptMessage =
          "First login detected. Please reset your password on My Profile, then log in again.";

        setAlertVariant("warning");
        setAlertMessage(promptMessage);

        onLoginSuccess?.(normalizedRole, promptMessage, {
          redirectTo: resolveMyProfilePath(normalizedRole),
          forcePasswordReset: true,
        });
        return;
      }

      onLoginSuccess?.(normalizedRole, data.message);

      // Optional: redirect or show success message
      setAlertVariant("success");
      setAlertMessage(data.message);
    } catch (error: any) {
      console.error("LOGIN ERROR:", error.message);
      setAlertVariant("danger");
      setAlertMessage(error.message);

      if (
        error.status === 423 ||
        error.code === "ACCOUNT_LOCKED" ||
        error.resetRequired
      ) {
        setShowLockedModal(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showForgotPasswordPage) return <EmailConfirm initialEmail={email} />;

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
          disabled={isSubmitting}
          required
        />
      </Form.Group>
      
      {/* Password */}
      <Form.Group className="mb-3" controlId="formPassword">
        <Form.Label>Password</Form.Label>
        <Form.Control
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isSubmitting}
          required
        />
      </Form.Group>

      {/* Remember me & Forgot password */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Form.Check
          type="checkbox"
          id="rememberMe"
          label="Remember me"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          disabled={isSubmitting}
        />
        <button
          type="button"
          onClick={() => setForgotPasswordPage(true)}
          disabled={isSubmitting}
          style={{
            fontSize: "14px",
            color: colors.gold6 || "#3b82f6",
            textDecoration: "none",
            fontWeight: "500",
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          Forgot password?
        </button>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="outline-warning"
        disabled={isSubmitting}
        style={{ width: "100%", fontWeight: 600 }}
      >
        {isSubmitting ? (
          <>
            <Spinner
              as="span"
              animation="border"
              size="sm"
              role="status"
              aria-hidden="true"
              className="me-2"
            />
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </Button>

      <Modal
        show={showLockedModal}
        onHide={() => setShowLockedModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Account Locked</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Your account has been locked after 3 failed login attempts. Please
          reset your password to regain access.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLockedModal(false)}>
            Close
          </Button>
          <Button
            variant="warning"
            onClick={() => {
              setShowLockedModal(false);
              setForgotPasswordPage(true);
            }}
          >
            Reset Password
          </Button>
        </Modal.Footer>
      </Modal>
    </Form>
  );
};

export default LoginForm;