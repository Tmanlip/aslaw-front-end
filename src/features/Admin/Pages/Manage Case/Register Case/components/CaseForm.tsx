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
  MenuItem,
} from "@mui/material";
import axiosUser from "../../../../../../api/axiosUser";
import { useNavigate } from "react-router-dom";
import PATH from "../../../../../../constant/paths";
import { useAuth } from "../../../../../../context/AuthContext";
import ClientSearch, { Client } from "./ClientSearch";
import LawyerSearch, { Lawyer } from "./LawyerSearch";

type ExpectedPayments = {
  initial: string;
  first: string;
  second: string;
  third: string;
  final: string;
};

type CaseType = "Litigation" | "Criminal" | "Corporate";

const getDefaultExpectedPayments = (caseType: CaseType): ExpectedPayments => {
  switch (caseType) {
    case "Criminal":
      return { initial: "1200", first: "1800", second: "2000", third: "2200", final: "2800" };
    case "Corporate":
      return { initial: "3000", first: "4500", second: "5000", third: "5500", final: "7000" };
    default:
      return { initial: "1500", first: "2500", second: "3000", third: "3000", final: "4000" };
  }
};

const CaseForm: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [caseType, setCaseType] = useState<CaseType>("Litigation");
  const [expectedPayments, setExpectedPayments] = useState<ExpectedPayments>(
    getDefaultExpectedPayments("Litigation")
  );

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string>("");
  const [submitError, setSubmitError] = useState<string>("");
  const [submitSuccess, setSubmitSuccess] = useState<string>("");
  const navigate = useNavigate();
  const { role } = useAuth();
  const adminPathGroup =
    role === "junioradmin"
      ? PATH.JUNIOR_ADMIN
      : role === "adminstaff"
      ? PATH.ADMIN_STAFF
      : PATH.ADMIN;
  const SUCCESS_REDIRECT_DELAY_MS = 1200;

  // 🔥 Fetch Clients
  const fetchClients = async () => {
    try {
      const res = await axiosUser.get(`/clients`);
      setClients(res.data);
    } catch (error) {
      console.error("Error fetching clients:", error);
      setFetchError("Failed to fetch clients. Make sure you are authenticated.");
    }
  };

  // 🔥 Fetch Lawyers
  const fetchLawyers = async () => {
    try {
      const res = await axiosUser.get(`/lawyers`);
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
    setSubmitSuccess("");

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
        caseType,
        description,
        lawyerID: selectedLawyer.firmID,
        clientID: selectedClient.firmID,
        expected_initial_payment: Number(expectedPayments.initial || 0),
        expected_first_payment: Number(expectedPayments.first || 0),
        expected_second_payment: Number(expectedPayments.second || 0),
        expected_third_payment: Number(expectedPayments.third || 0),
        expected_final_payment: Number(expectedPayments.final || 0),
      };

      await axiosUser.post(`/registercases`, payload);

      setSubmitSuccess("Case registered successfully!");

      window.setTimeout(() => {
        navigate(adminPathGroup.MANAGE_CASE);
      }, SUCCESS_REDIRECT_DELAY_MS);
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
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 4 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        background: "linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%)",
        boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
      }}
    >
      <Stack spacing={0.75} sx={{ mb: 3 }}>
        <Typography variant="overline" sx={{ color: "#0f766e", fontWeight: 700, letterSpacing: "0.12em" }}>
          ADMIN WORKFLOW
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#1f2937" }}>
          Register Case
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Assign the parties, define the case type, and set payment milestones in a single step.
        </Typography>
      </Stack>

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
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {submitError}
        </Alert>
      )}

      {submitSuccess && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
          {submitSuccess}
        </Alert>
      )}

      {!fetchLoading && clients.length > 0 && lawyers.length > 0 && (
        <Stack spacing={2.5}>
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
            label="Case Type"
            select
            fullWidth
            value={caseType}
            onChange={(e) => {
              const nextType = e.target.value as CaseType;
              setCaseType(nextType);
              setExpectedPayments(getDefaultExpectedPayments(nextType));
            }}
          >
            <MenuItem value="Litigation">Litigation</MenuItem>
            <MenuItem value="Criminal">Criminal</MenuItem>
            <MenuItem value="Corporate">Corporate</MenuItem>
          </TextField>

          <TextField
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Stack spacing={0.25}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1f2937" }}>
              Expected Payment Phases
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Define the amount for each milestone before submitting the case.
            </Typography>
          </Stack>

          <TextField
            label="Initial Phase (RM)"
            type="number"
            inputProps={{ min: 0, step: "0.01" }}
            fullWidth
            value={expectedPayments.initial}
            onChange={(e) => setExpectedPayments((prev) => ({ ...prev, initial: e.target.value }))}
          />

          <TextField
            label="First Phase (RM)"
            type="number"
            inputProps={{ min: 0, step: "0.01" }}
            fullWidth
            value={expectedPayments.first}
            onChange={(e) => setExpectedPayments((prev) => ({ ...prev, first: e.target.value }))}
          />

          <TextField
            label="Second Phase (RM)"
            type="number"
            inputProps={{ min: 0, step: "0.01" }}
            fullWidth
            value={expectedPayments.second}
            onChange={(e) => setExpectedPayments((prev) => ({ ...prev, second: e.target.value }))}
          />

          <TextField
            label="Third Phase (RM)"
            type="number"
            inputProps={{ min: 0, step: "0.01" }}
            fullWidth
            value={expectedPayments.third}
            onChange={(e) => setExpectedPayments((prev) => ({ ...prev, third: e.target.value }))}
          />

          <TextField
            label="Final Phase (RM)"
            type="number"
            inputProps={{ min: 0, step: "0.01" }}
            fullWidth
            value={expectedPayments.final}
            onChange={(e) => setExpectedPayments((prev) => ({ ...prev, final: e.target.value }))}
          />

          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handleSubmit}
            disabled={loading}
            sx={{
              py: 1.4,
              borderRadius: 2,
              fontWeight: 700,
              textTransform: "none",
              background: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",
            }}
          >
            {loading ? (
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                <CircularProgress size={20} color="inherit" />
                <span>Submitting...</span>
              </Stack>
            ) : (
              "Register Case"
            )}
          </Button>
        </Stack>
      )}
    </Paper>
  );
};

export default CaseForm;