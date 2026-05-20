import { useMemo } from "react";
import { useAuth } from "../../../context/AuthContext";

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

const formatRoleLabel = (role: string): string => {
  switch (role.toLowerCase()) {
    case "admin":
      return "Admin";
    case "adminstaff":
      return "Admin Staff";
    case "junioradmin":
      return "Junior Admin";
    case "lawyer":
      return "Lawyer";
    case "client":
      return "Client";
    default:
      return role.charAt(0).toUpperCase() + role.slice(1);
  }
};

export default function CornerIdentityBadge() {
  const { user, role, loading } = useAuth();

  const displayName = useMemo(() => {
    const username = normalizeString(user?.username);
    if (username) {
      return username;
    }

    const name = normalizeString(user?.name);
    if (name) {
      return name;
    }

    const email = normalizeString(user?.email);
    if (email.includes("@")) {
      return email.split("@")[0];
    }

    return email;
  }, [user]);

  if (loading || !role || !displayName) {
    return null;
  }

  const roleLabel = formatRoleLabel(role);

  return (
    <div className="aslaw-corner-identity" aria-live="polite" aria-label={`Logged in as ${roleLabel} ${displayName}`}>
      <span className="aslaw-corner-identity-label">User</span>
      <strong className="aslaw-corner-identity-name">{roleLabel} | {displayName}</strong>
    </div>
  );
}
