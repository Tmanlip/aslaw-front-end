import React, { useEffect, useRef, useState } from "react";
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
  const processedKeyRef = useRef<string | null>(null);

  const token = searchParams.get("token") || "";
  const roleParam = (searchParams.get("role") || "").toLowerCase();
  const encodedUser = searchParams.get("user") || "";
  const message = searchParams.get("message") || "Login successful";
  const mustChangePassword = searchParams.get("must_change_password") === "1";
  const errorMessage = searchParams.get("error");

  useEffect(() => {
    const callbackKey = `${token}|${roleParam}|${encodedUser}`;

    if (processedKeyRef.current === callbackKey) {
      return;
    }

    processedKeyRef.current = callbackKey;

    try {
      if (errorMessage) {
        setError(errorMessage);
        return;
      }

      if (!token) {
        setError("Missing SSO token. Please try again.");
        return;
      }

      if (!["admin", "adminstaff", "junioradmin", "lawyer", "client"].includes(roleParam)) {
        setError("Invalid SSO role payload.");
        return;
      }

      const role = roleParam as Role;
      let user: any = { role };

      if (encodedUser) {
        const decoded = decodeBase64Url(encodedUser);
        user = JSON.parse(decoded);
      }

      if (mustChangePassword) {
        user.must_change_password = true;
      }

      AuthMemory.setAuth(token, user, true);
      login(role, user, true);

      navigate(getDashboardPath(role), {
        replace: true,
        state: {
          successMessage: message,
          forcePasswordReset: mustChangePassword,
        },
      });
    } catch (callbackError: any) {
      setError(callbackError?.message || "SSO callback handling failed.");
    }
  }, [encodedUser, errorMessage, login, message, mustChangePassword, navigate, roleParam, token]);

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
