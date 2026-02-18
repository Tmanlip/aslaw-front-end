import React from "react";
import { Autocomplete, TextField } from "@mui/material";

export interface Client {
  id: number;
  name: string;
  email: string;
  firmID: string;   // 🔥 add this
  status: string;
}

interface Props {
  clients: Client[];
  selectedClient: Client | null;
  onChange: (client: Client | null) => void;
}

const ClientSearch: React.FC<Props> = ({
  clients,
  selectedClient,
  onChange,
}) => {
  return (
    <Autocomplete
      options={clients}
      getOptionLabel={(option) => option.name}
      value={selectedClient}
      onChange={(_, newValue) => onChange(newValue)}
      renderInput={(params) => (
        <TextField {...params} label="Search Client" fullWidth />
      )}
    />
  );
};

export default ClientSearch;