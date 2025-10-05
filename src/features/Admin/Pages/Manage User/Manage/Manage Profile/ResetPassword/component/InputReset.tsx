// src/components/PasswordInput.tsx
import React, { useState } from "react";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Button from "react-bootstrap/Button";
import { FaEye, FaEyeSlash } from "react-icons/fa";

interface PasswordInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  label = "Password",
  placeholder = "Enter password",
  value,
  onChange,
  name = "password",
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  return (
    <Form.Group className="mb-3">
      {label && <Form.Label htmlFor={name}>{label}</Form.Label>}
      <InputGroup>
        <Form.Control
          id={name}
          name={name}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required
        />
        <Button
          variant="outline-secondary"
          onClick={togglePasswordVisibility}
          type="button"
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