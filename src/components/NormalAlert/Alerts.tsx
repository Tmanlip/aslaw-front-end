import React from "react";
import { Alert } from "react-bootstrap";

interface CustomAlertProps {
  variant: string;
  message: React.ReactNode; // ✅ FIX HERE
  onClose?: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  variant,
  message,
  onClose,
}) => {
  return (
    <Alert variant={variant} dismissible={!!onClose} onClose={onClose}>
      {message}
    </Alert>
  );
};

export default CustomAlert;