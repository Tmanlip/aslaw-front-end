import React from "react";
import { Autocomplete, TextField } from "@mui/material";

export interface Lawyer {
  id: number;
  name: string;
  email: string;
  firmID: string;   // 🔥 add this
  status: string;
}

interface Props {
  lawyers: Lawyer[];
  selectedLawyer: Lawyer | null;
  onChange: (lawyer: Lawyer | null) => void;
}

const LawyerSearch: React.FC<Props> = ({
  lawyers,
  selectedLawyer,
  onChange,
}) => {
  return (
    <Autocomplete
      options={lawyers}
      getOptionLabel={(option) => option.name}
      value={selectedLawyer}
      onChange={(_, newValue) => onChange(newValue)}
      renderInput={(params) => (
        <TextField {...params} label="Search Lawyer" fullWidth />
      )}
    />
  );
};

export default LawyerSearch;