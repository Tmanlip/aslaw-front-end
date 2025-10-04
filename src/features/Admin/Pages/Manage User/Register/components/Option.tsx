// src/components/CustomDropdown.tsx
import React from "react";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";

type CustomDropdownProps = {
  title: string;
  options: string[];
  onSelect: (value: string) => void;
};

const CustomDropdown: React.FC<CustomDropdownProps> = ({ title, options, onSelect }) => {
  return (
    <DropdownButton id="dropdown-basic-button" title={title}>
      {options.map((option, index) => (
        <Dropdown.Item key={index} onClick={() => onSelect(option)}>
          {option}
        </Dropdown.Item>
      ))}
    </DropdownButton>
  );
};

export default CustomDropdown;