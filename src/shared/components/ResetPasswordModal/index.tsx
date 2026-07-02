import React, { useState, useEffect, useCallback } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import Alert from "react-bootstrap/Alert";
import axios from "axios";
import axiosUser from "../../../api/axiosUser";
import { resolveApiBaseUrl } from "../../../api/resolveApiBaseUrl";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import AuthMemory from "../../../data/authMemory";
import PATH from "../../../constant/paths";

interface ResetPasswordModalProps {
  show: boolean;
  email: string;
  firmID: string;
  forceReloginAfterReset?: boolean;
  onClose: () => void;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  show,
  email,
  firmID,
  forceReloginAfterReset = false,
  onClose,
}) => {
  const apiBaseUrl = resolveApiBaseUrl();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const [verified, setVerified] = useState(false);

  const resetStates = () => {
    setOtp(["", "", "", "", "", ""]);
    setOtpError(null);
    setOtpSuccess(null);
    setSendingOtp(false);

    setPassword("");
    setConfirmPassword("");
    setResetError(null);
    setResetSuccess(null);
    setVerified(false);
  };

  const sendOtp = useCallback(async () => {
    try {
      setSendingOtp(true);
      setOtpError(null);
      setOtpSuccess(null);

      await axios.post(`${apiBaseUrl}/password/send-otp`, { email });
      setOtpSuccess("OTP sent to your email.");
    } catch (err: any) {
      setOtpError("Failed to send OTP.");
    } finally {
      setSendingOtp(false);
    }
  }, [apiBaseUrl, email]);

  useEffect(() => {
    if (show) {
      resetStates();
      void sendOtp();
    }
  }, [show, sendOtp]);

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement;
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement;
      prevInput?.focus();
    }
  };

  const handleVerifyCode = async () => {
    const code = otp.join("");

    try {
      setOtpLoading(true);
      setOtpError(null);
      setOtpSuccess(null);

      await axios.post(`${apiBaseUrl}/password/verify-code`, {
        email,
        code,
      });

      setOtpSuccess("Verification successful.");
      setVerified(true);
    } catch (err: any) {
      setOtpError("Invalid or expired verification code.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (password !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }

    try {
      setResetLoading(true);
      setResetError(null);
      setResetSuccess(null);

      await axiosUser.put(`/users/${firmID}`, {
        password,
      });

      if (forceReloginAfterReset) {
        try {
          await axiosUser.post("/logout");
        } catch {
          // Continue local logout even if API logout fails.
        }

        logout();
        AuthMemory.clear();
        setResetSuccess("Password reset successful. Please log in again.");
        setTimeout(() => {
          onClose();
          navigate(PATH.AUTH.LOGIN, { replace: true });
        }, 1500);
        return;
      }

      setResetSuccess("Password reset successful.");
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setResetError("Failed to reset password.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{verified ? "Reset Password" : "Verify Code"}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {verified ? (
          <>
            {resetError && <Alert variant="danger">{resetError}</Alert>}
            {resetSuccess && <Alert variant="success">{resetSuccess}</Alert>}

            <Form>
              <Form.Group className="mb-3">
                <Form.Label>New Password</Form.Label>
                <Form.Control
                  type="password"
                  value={password}
                  disabled={resetLoading}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control
                  type="password"
                  value={confirmPassword}
                  disabled={resetLoading}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </Form.Group>
            </Form>
          </>
        ) : (
          <>
            <Alert variant="info">A 6-digit verification code has been sent to your email.</Alert>

            {otpError && <Alert variant="danger">{otpError}</Alert>}
            {otpSuccess && <Alert variant="success">{otpSuccess}</Alert>}

            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Email Address</Form.Label>
                <Form.Control type="email" value={email} disabled />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label>Verification Code</Form.Label>
                <div className="d-flex justify-content-between gap-2 mt-2">
                  {otp.map((digit, index) => (
                    <Form.Control
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      value={digit}
                      maxLength={1}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      className="text-center fs-4"
                      style={{ width: "48px", height: "48px" }}
                      disabled={otpLoading}
                      onChange={(e) => handleOtpChange(e.target.value, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    />
                  ))}
                </div>
              </Form.Group>

              <Button
                variant="link"
                onClick={() => void sendOtp()}
                disabled={sendingOtp || otpLoading}
                className="p-0 mt-2"
              >
                {sendingOtp ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Sending OTP...
                  </>
                ) : (
                  "Resend OTP"
                )}
              </Button>
            </Form>
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={otpLoading || resetLoading || sendingOtp}
        >
          Cancel
        </Button>

        {verified ? (
          <Button
            variant="primary"
            onClick={() => void handleResetPassword()}
            disabled={resetLoading || !password || !confirmPassword}
          >
            {resetLoading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Resetting...
              </>
            ) : (
              "Reset Password"
            )}
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={() => void handleVerifyCode()}
            disabled={otpLoading || otp.some((d) => d === "")}
          >
            {otpLoading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ResetPasswordModal;
