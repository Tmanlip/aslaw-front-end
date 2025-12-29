// src/features/Admin/Pages/Manage User/Register/components/Option.tsx
import React, { useState } from "react";
import { Dropdown } from "react-bootstrap";

type Option = {
  label: string;
  value: string; // firmID as string
};

type CustomDropdownProps = {
  title: string;
  options: Option[];
  onSelect: (value: string) => void; // returns firmID
};

const CustomDropdown: React.FC<CustomDropdownProps> = ({ title, options, onSelect }) => {
  const [selected, setSelected] = useState<string>("");

  const handleSelect = (value: string) => {
    setSelected(value);
    onSelect(value); // send firmID to parent
  };

  return (
    <Dropdown>
      <Dropdown.Toggle variant="secondary" id="dropdown-basic">
        {selected
          ? options.find((o) => o.value === selected)?.label
          : title}
      </Dropdown.Toggle>

      <Dropdown.Menu>
        {options.map((option) => (
          <Dropdown.Item
            key={option.value}
            onClick={() => handleSelect(option.value)}
          >
            {option.label}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default CustomDropdown;