import React from "react";
import Dropdown from "react-bootstrap/Dropdown";
import {
  Wrapper,
  Label,
  StyledDropdownButton,
} from "./style";

interface Option {
  value: string;
  label: string;
}

interface BootstrapDropdownProps {
  id: string;
  label: string;
  options: Option[];
  selectedValue?: string;
  onChange: (value: string) => void;
}

const BootstrapDropdown: React.FC<BootstrapDropdownProps> = ({
  id,
  label,
  options,
  selectedValue,
  onChange,
}) => {
  return (
    <Wrapper>
      <Label>{label}</Label>
      <StyledDropdownButton
        id={id}
        title={selectedValue || `Select ${label}`}
        onSelect={(val) => onChange(val || "")}
        variant="secondary" 
      >
        {options.map((opt, idx) => (
          <Dropdown.Item eventKey={opt.value} key={idx}>
            {opt.label}
          </Dropdown.Item>
        ))}
      </StyledDropdownButton>
    </Wrapper>
  );
};

export default BootstrapDropdown;
