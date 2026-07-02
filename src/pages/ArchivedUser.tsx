import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthMemory from "../data/authMemory";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import { colors } from "../constant/color";
import { resolveApiBaseUrl } from "../api/resolveApiBaseUrl";

const ArchivedUserPage: React.FC = () => {
  const apiBaseUrl = resolveApiBaseUrl();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      // Call logout endpoint
      const token = AuthMemory.getToken();
      if (token) {
        await fetch(`${apiBaseUrl}/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }).catch((err) => {
          // Ignore errors during logout
        });
      }

      // Clear local auth state
      logout();
      AuthMemory.clear();

      // Redirect to home
      navigate("/", { replace: true });
    } catch (error) {
      // Force clear and redirect anyway
      logout();
      AuthMemory.clear();
      navigate("/", { replace: true });
    }
  };

  return (
    <Container style={{ marginTop: "3rem", textAlign: "center" }}>
      <Alert variant="danger" className="mb-4">
        <Alert.Heading>Account Deactivated</Alert.Heading>
        <p>
          Your account has been deactivated by an administrator. You can only
          log out at this time. Please contact the administrator if you believe
          this is a mistake.
        </p>
      </Alert>

      <Button
        onClick={handleLogout}
        variant="outline-danger"
        size="lg"
        style={{
          fontWeight: 600,
          marginTop: "2rem",
          borderColor: colors.gold6 || "#dc3545",
          color: colors.gold6 || "#dc3545",
        }}
      >
        Log Out
      </Button>
    </Container>
  );
};

export default ArchivedUserPage;
