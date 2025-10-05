// src/components/PasswordInput.tsx
import React, { useState } from "react";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Button from "react-bootstrap/Button";
import { FaEye, FaEyeSlash } from "react-icons/fa";

interface PasswordInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Form.Group className="mb-3">
      <Form.Label>{label}</Form.Label>
      <InputGroup>
        <Form.Control
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required
        />
        <Button
          variant="outline-secondary"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword
            ? (FaEyeSlash({}) as React.ReactElement)
            : (FaEye({}) as React.ReactElement)
          }

        </Button>
      </InputGroup>
    </Form.Group>
  );
};

export default PasswordInput;