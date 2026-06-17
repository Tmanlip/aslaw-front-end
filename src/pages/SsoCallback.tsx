import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Alert from "react-bootstrap/Alert";
import Spinner from "react-bootstrap/Spinner";
import PATH from "../constant/paths";
import AuthMemory from "../data/authMemory";
import { useAuth } from "../context/AuthContext";

type Role = "admin" | "adminstaff" | "junioradmin" | "client" | "lawyer";

const decodeBase64Url = (value: string): string => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return atob(normalized + padding);
};

const getDashboardPath = (role: Role): string => {
  if (role === "admin") return PATH.ADMIN.DASHBOARD;
  if (role === "adminstaff") return PATH.ADMIN_STAFF.DASHBOARD;
  if (role === "junioradmin") return PATH.JUNIOR_ADMIN.DASHBOARD;
  if (role === "lawyer") return PATH.LAWYER.DASHBOARD;
  return PATH.CLIENT.DASHBOARD;
};

const SsoCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const parsed = useMemo(() => {
    // Backend returns SSO payload through query params after Entra callback processing.
    const token = searchParams.get("token") || "";
    const role = (searchParams.get("role") || "").toLowerCase();
    const encodedUser = searchParams.get("user") || "";
    const message = searchParams.get("message") || "Login successful";
    const mustChangePassword = searchParams.get("must_change_password") === "1";

    return {
      token,
      role,
      encodedUser,
      message,
      mustChangePassword,
    };
  }, [searchParams]);

  useEffect(() => {
    try {
      const errorMessage = searchParams.get("error");
      if (errorMessage) {
        setError(errorMessage);
        return;
      }

      if (!parsed.token) {
        setError("Missing SSO token. Please try again.");
        return;
      }

      if (!["admin", "adminstaff", "junioradmin", "lawyer", "client"].includes(parsed.role)) {
        setError("Invalid SSO role payload.");
        return;
      }

      const role = parsed.role as Role;
      let user: any = { role };

      if (parsed.encodedUser) {
        // User profile is base64url-encoded to keep callback payload URL-safe.
        const decoded = decodeBase64Url(parsed.encodedUser);
        user = JSON.parse(decoded);
      }

      if (parsed.mustChangePassword) {
        user.must_change_password = true;
      }

      AuthMemory.setAuth(parsed.token, user, true);
      login(role, user, true);

      // Short timeout keeps navigation in next task queue so state is committed first.
      setTimeout(() => {
        navigate(getDashboardPath(role), {
          replace: true,
          state: {
            successMessage: parsed.message,
            forcePasswordReset: parsed.mustChangePassword,
          },
        });
      }, 10);
    } catch (callbackError: any) {
      setError(callbackError?.message || "SSO callback handling failed.");
    }
  }, [login, navigate, parsed, searchParams]);

  if (error) {
    return (
      <div style={{ maxWidth: 700, margin: "3rem auto", padding: "0 1rem" }}>
        <Alert variant="danger">
          <Alert.Heading>Microsoft SSO failed</Alert.Heading>
          <p>{error}</p>
        </Alert>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: "3rem auto", textAlign: "center", padding: "0 1rem" }}>
      <Spinner animation="border" role="status" />
      <p style={{ marginTop: "1rem" }}>Signing you in with Microsoft...</p>
    </div>
  );
};

export default SsoCallback;
