// src/components/CustomAlert.tsx
import React, { useEffect } from 'react';
import Alert from 'react-bootstrap/Alert';

type CustomAlertProps = {
  variant: 'success' | 'danger' | 'warning' | 'info';
  message: string;
  onClose: () => void;
  duration?: number; // in ms, default 3000
};

const CustomAlert: React.FC<CustomAlertProps> = ({ variant, message, onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <Alert variant={variant} dismissible onClose={onClose}>
      {message}
    </Alert>
  );
};

export default CustomAlert;