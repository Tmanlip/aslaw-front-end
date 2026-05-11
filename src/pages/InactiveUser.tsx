import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthMemory from "../data/authMemory";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import { colors } from "../constant/color";

const InactiveUserPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      // Call logout endpoint
      const token = AuthMemory.getToken();
      if (token) {
        await fetch(`${process.env.REACT_APP_API_URL}/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }).catch((err) => {
          // Ignore errors during logout
          console.warn("Logout API call failed (this is OK):", err);
        });
      }

      // Clear local auth state
      logout();
      AuthMemory.clear();

      // Redirect to home
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      // Force clear and redirect anyway
      logout();
      AuthMemory.clear();
      navigate("/", { replace: true });
    }
  };

  return (
    <Container style={{ marginTop: "3rem", textAlign: "center" }}>
      <Alert variant="warning" className="mb-4">
        <Alert.Heading>Account Inactive</Alert.Heading>
        <p>
          Your account is currently inactive. You cannot access the system at
          this time. Please contact the administrator to reactivate your account.
        </p>
      </Alert>

      <Button
        onClick={handleLogout}
        variant="outline-warning"
        size="lg"
        style={{
          fontWeight: 600,
          marginTop: "2rem",
          borderColor: colors.gold6 || "#ffc107",
          color: colors.gold6 || "#ffc107",
        }}
      >
        Log Out
      </Button>
    </Container>
  );
};

export default InactiveUserPage;
