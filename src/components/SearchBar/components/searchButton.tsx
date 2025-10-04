// src/components/SubmitButton.tsx
import React from "react";
import Button from "react-bootstrap/Button";

type SubmitButtonProps = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: string;
};

const SubmitButton: React.FC<SubmitButtonProps> = ({
  label,
  onClick,
  disabled = false,
  variant = "secondary",
}) => {
  return (
    <Button
      type="submit"
      variant={variant}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </Button>
  );
};

export default SubmitButton;