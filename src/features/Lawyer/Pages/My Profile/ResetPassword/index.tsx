// src/pages/ResetPassword.tsx
import React, { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { colors } from "../../../../../constant/color";
import PasswordInput from "./component/InputReset";
import companyPic from "../../../../assets/pics/logo-landscape.png" // ✅ your company logo

const ResetPassword: React.FC = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New password and confirmation do not match!");
      return;
    }
    console.log("Old:", oldPassword, "New:", newPassword, "Confirm:", confirmPassword);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: colors.gold2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={5}>
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                padding: "30px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                textAlign: "center",
              }}
            >
              {/* ✅ Company logo once at the top */}
              <img
                src={companyPic}
                alt="Company Logo"
                width="80"
                className="mb-3"
              />
              <h3 className="mb-4">Reset Password</h3>

              <Form onSubmit={handleSubmit}>
                <PasswordInput
                  label="Old Password"
                  placeholder="Enter old password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
                <PasswordInput
                  label="New Password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <PasswordInput
                  label="Confirm Password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <div className="d-grid">
                  <Button variant="primary" type="submit">
                    Reset Password
                  </Button>
                </div>
              </Form>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ResetPassword;
