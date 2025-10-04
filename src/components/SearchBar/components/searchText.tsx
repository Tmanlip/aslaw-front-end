// src/components/components/searchText.tsx
import React from "react";
import Form from "react-bootstrap/Form";

type SearchInputProps = {
  placeholder?: string;
  value: string;
  onChange: (val: string) => void; // ✅ only string, not full event
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
};

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = "Search...",
  value,
  onChange,
  onKeyDown,
}) => {
  return (
    <Form.Control
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)} // ✅ convert event → string
      onKeyDown={onKeyDown}
    />
  );
};

export default SearchInput;
