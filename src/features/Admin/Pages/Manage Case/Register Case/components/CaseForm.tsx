import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Paper,
  Typography,
  Stack,
  CircularProgress,
  Alert,
  Box,
} from "@mui/material";
import axiosUser from "../../../../../../api/axiosUser";
import { useNavigate } from "react-router-dom";
import PATH from "../../../../../../constant/paths";
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
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string>("");
  const [submitError, setSubmitError] = useState<string>("");
  const navigate = useNavigate();

  // 🔥 Fetch Clients
  const fetchClients = async () => {
    try {
      const res = await axiosUser.get(`${API_URL}/clients`);
      setClients(res.data);
    } catch (error) {
      console.error("Error fetching clients:", error);
      setFetchError("Failed to fetch clients. Make sure you are authenticated.");
    }
  };

  // 🔥 Fetch Lawyers
  const fetchLawyers = async () => {
    try {
      const res = await axiosUser.get(`${API_URL}/lawyers`);
      setLawyers(res.data);
    } catch (error) {
      console.error("Error fetching lawyers:", error);
      setFetchError("Failed to fetch lawyers. Make sure you are authenticated.");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setFetchLoading(true);
      await Promise.all([fetchClients(), fetchLawyers()]);
      setFetchLoading(false);
    };
    loadData();
  }, []);

  const handleSubmit = async () => {
    setSubmitError("");

    if (!title.trim()) {
      setSubmitError("Case title is required");
      return;
    }

    if (!description.trim()) {
      setSubmitError("Case description is required");
      return;
    }

    if (!selectedClient) {
      setSubmitError("Please select a client");
      return;
    }

    if (!selectedLawyer) {
      setSubmitError("Please select a lawyer");
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

      await axiosUser.post(`${API_URL}/registercases`, payload);

      // Redirect to admin case list page
      navigate(PATH.ADMIN.MANAGE_CASE);
    } catch (error: any) {
      console.error("Error creating case:", error);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message ||
                          "Case creation failed. Please check the selected lawyer and client.";
      setSubmitError(errorMessage);
    }

    setLoading(false);
  };

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Register Case
      </Typography>

      {fetchLoading && (
        <Box display="flex" alignItems="center" justifyContent="center" my={4}>
          <CircularProgress />
          <Typography ml={2}>Loading lawyers and clients...</Typography>
        </Box>
      )}

      {fetchError && !fetchLoading && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {fetchError}
        </Alert>
      )}

      {!fetchLoading && clients.length === 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          ⚠️ No clients found. Please register clients first before creating a case.
        </Alert>
      )}

      {!fetchLoading && lawyers.length === 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          ⚠️ No lawyers found. Please register lawyers first before creating a case.
        </Alert>
      )}

      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
        </Alert>
      )}

      {!fetchLoading && clients.length > 0 && lawyers.length > 0 && (
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
      )}
    </Paper>
  );
};

export default CaseForm;