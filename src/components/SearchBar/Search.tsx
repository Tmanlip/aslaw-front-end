// src/components/SearchBar.tsx
import React from "react";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import SearchInput from "./components/searchText";
import SubmitButton from "./components/searchButton";

type SearchBarProps = {
  placeholder?: string;
  value: string;
  onChange: (val: string) => void; // ✅ accepts string only
  onSearch: () => void;
  buttonLabel?: string;
  variant?: "header" | "sidebar";
};

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Search...",
  value,
  onChange,
  onSearch,
  buttonLabel = "Search",
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <Form onSubmit={handleSubmit}>
      <InputGroup>
        <SearchInput
          value={value}
          onChange={onChange} // ✅ pass directly (no event wrapping)
          placeholder={placeholder}
        />
        <SubmitButton label={buttonLabel} />
      </InputGroup>
    </Form>
  );
};

export default SearchBar;
