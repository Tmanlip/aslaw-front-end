import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Paper,
  Typography,
  Stack,
  CircularProgress,
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ClientSearch, { Client } from "./ClientSearch";
import LawyerSearch, { Lawyer } from "./LawyerSearch";

const API_URL = process.env.REACT_APP_API_URL;

const CaseForm: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 🔥 Fetch Clients
  const fetchClients = async () => {
    try {
      const res = await axios.get(`${API_URL}/clients`);
      setClients(res.data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  // 🔥 Fetch Lawyers
  const fetchLawyers = async () => {
    try {
      const res = await axios.get(`${API_URL}/lawyers`);
      setLawyers(res.data);
    } catch (error) {
      console.error("Error fetching lawyers:", error);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchLawyers();
  }, []);

    const handleSubmit = async () => {
    if (!selectedClient || !selectedLawyer) {
        alert("Please select client and lawyer");
        return;
    }

    setLoading(true);

    try {
        const payload = {
        title,
        description,
        lawyerID: selectedLawyer.firmID,
        clientID: selectedClient.firmID,
        };

        await axios.post(`${API_URL}/cases`, payload);

        // ✅ Redirect to cases list page
        navigate("/cases");

    } catch (error) {
        console.error("Error creating case:", error);
        alert("Case creation failed");
    }

    setLoading(false);
    };

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Register Case
      </Typography>

      <Stack spacing={3}>
        <ClientSearch
          clients={clients}
          selectedClient={selectedClient}
          onChange={setSelectedClient}
        />

        {selectedClient && (
          <TextField
            label="Client Firm ID"
            value={selectedClient.firmID}
            fullWidth
            disabled
          />
        )}

        <LawyerSearch
          lawyers={lawyers}
          selectedLawyer={selectedLawyer}
          onChange={setSelectedLawyer}
        />

        {selectedLawyer && (
          <TextField
            label="Lawyer Firm ID"
            value={selectedLawyer.firmID}
            fullWidth
            disabled
          />
        )}

        <TextField
          label="Case Title"
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <TextField
          label="Description"
          fullWidth
          multiline
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Register Case"}
        </Button>
      </Stack>
    </Paper>
  );
};

export default CaseForm;