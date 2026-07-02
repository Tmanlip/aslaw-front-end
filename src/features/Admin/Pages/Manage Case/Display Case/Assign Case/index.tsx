import React, { useEffect, useMemo, useState } from "react";
import Offcanvas from "react-bootstrap/Offcanvas";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import Alert from "react-bootstrap/Alert";
import axiosUser from "../../../../../../api/axiosUser";
import Page1Form from "../../../Manage User/Register/Register Case/pageoneform";
import type { FeeOption, User } from "../../../Manage User/Register/Register Case";
import { createFailureMessage } from "../../../Manage User/Register/feedback";
import "../../../Manage User/Register/Register Case/registerCase.css";
import "./assignCase.css";

interface CaseRecord {
  id: number;
  clientName?: string;
  clientFirmID?: string;
}

interface AddCaseOffcanvasProps {
  show: boolean;
  handleClose: () => void;
  selectedCase: CaseRecord | null;
  onCaseAssigned?: (caseId: number) => void;
}

type StageKey = "initial" | "first" | "second" | "third" | "final";
type CaseType = "Litigation" | "Criminal" | "Corporate";
type StageSelections = Record<StageKey, string[]>;
type StageAmountInputs = Record<StageKey, Record<string, string>>;

const STAGES: StageKey[] = ["initial", "first", "second", "third", "final"];

const buildEmptyStageSelections = (): StageSelections => ({
  initial: [],
  first: [],
  second: [],
  third: [],
  final: [],
});

const buildEmptyStageAmountInputs = (): StageAmountInputs => ({
  initial: {},
  first: {},
  second: {},
  third: {},
  final: {},
});

const AddCaseOffcanvas: React.FC<AddCaseOffcanvasProps> = ({
  show,
  handleClose,
  selectedCase,
  onCaseAssigned,
}) => {
  const [caseName, setCaseName] = useState("");
  const [caseType, setCaseType] = useState<CaseType>("Litigation");
  const [description, setDescription] = useState("");
  const [feeOptions, setFeeOptions] = useState<FeeOption[]>([]);
  const [selectedTypeOfWorkValues, setSelectedTypeOfWorkValues] = useState<StageSelections>(buildEmptyStageSelections());
  const [selectedTypeOfWorkAmounts, setSelectedTypeOfWorkAmounts] = useState<StageAmountInputs>(buildEmptyStageAmountInputs());

  const [lawyer, setLawyer] = useState<User | null>(null);
  const [client, setClient] = useState<User | null>(null);
  const [lawyerOptions, setLawyerOptions] = useState<User[]>([]);
  const [clientOptions, setClientOptions] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [feeOptionsLoading, setFeeOptionsLoading] = useState(false);
  const [feeOptionsError, setFeeOptionsError] = useState("");
  const [submitFeedback, setSubmitFeedback] = useState<{ variant: string; message: string } | null>(null);
  const [showAlert, setShowAlert] = useState(false);

  const selectedClientDisplay = useMemo(() => {
    if (!selectedCase?.clientFirmID) {
      return client?.name ?? "Client";
    }

    return client?.name ?? selectedCase.clientName ?? "Client";
  }, [client?.name, selectedCase?.clientFirmID, selectedCase?.clientName]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axiosUser.get<User[]>("/users");
        const users = Array.isArray(res.data) ? res.data : [];
        setLawyerOptions(users.filter((user) => user.role === "lawyer"));
        setClientOptions(users.filter((user) => user.role === "client"));
      } catch (error) {
        console.error("Failed to fetch users", error);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchFeeOptions = async () => {
      setFeeOptionsLoading(true);
      setFeeOptionsError("");

      try {
        const res = await axiosUser.get("/case-type-work-options", {
          params: { caseType },
        });

        setFeeOptions(Array.isArray(res.data?.items) ? res.data.items : []);
        setFeeOptionsError("");
        setSelectedTypeOfWorkValues(buildEmptyStageSelections());
        setSelectedTypeOfWorkAmounts(buildEmptyStageAmountInputs());
      } catch (error: any) {
        console.error("Failed to fetch type of work options", error);
        setFeeOptions([]);
        const status = Number(error?.response?.status || 0);
        const backendMessage = String(error?.response?.data?.message || "").trim();
        setFeeOptionsError(
          backendMessage ||
            (status === 401 || status === 403
              ? "Unauthorized while loading Type of Work options."
              : "Unable to load Type of Work options right now.")
        );
      } finally {
        setFeeOptionsLoading(false);
      }
    };

    fetchFeeOptions();
  }, [caseType]);

  useEffect(() => {
    setCaseName("");
    setCaseType("Litigation");
    setDescription("");
    setFeeOptions([]);
    setSelectedTypeOfWorkValues(buildEmptyStageSelections());
    setSelectedTypeOfWorkAmounts(buildEmptyStageAmountInputs());
    setLawyer(null);
    setClient(null);
    setLoading(false);
    setFeeOptionsError("");
    setSubmitFeedback(null);
    setShowAlert(false);
  }, [selectedCase?.id]);

  useEffect(() => {
    if (!selectedCase?.clientFirmID) {
      setClient(null);
      return;
    }

    const matchedClient = clientOptions.find((user) => user.firmID === selectedCase.clientFirmID);
    if (matchedClient) {
      setClient(matchedClient);
      return;
    }

    setClient({
      id: selectedCase.id,
      name: selectedCase.clientName ?? "Client",
      role: "client",
      firmID: selectedCase.clientFirmID,
    });
  }, [clientOptions, selectedCase]);

  const getOptionKey = (option: FeeOption) => `${option.typeOfWork}|||${option.estimationFeesRange}`;

  const getStageSelectedItems = (stage: StageKey) => {
    const selectedValues = selectedTypeOfWorkValues[stage];
    return feeOptions.filter((option) => selectedValues.includes(getOptionKey(option)));
  };

  const getEnteredAmount = (stage: StageKey, optionKey: string): number => {
    const raw = selectedTypeOfWorkAmounts[stage]?.[optionKey] ?? "";
    const amount = Number(raw);
    return Number.isFinite(amount) ? amount : 0;
  };

  const getStageAmount = (stage: StageKey) =>
    getStageSelectedItems(stage).reduce((sum, item) => sum + getEnteredAmount(stage, getOptionKey(item)), 0);

  const handleResetExpectedPayments = () => {
    setSelectedTypeOfWorkValues(buildEmptyStageSelections());
    setSelectedTypeOfWorkAmounts(buildEmptyStageAmountInputs());
  };

  const handleTryClose = () => {
    setShowAlert(true);
  };

  const handleSubmit = async () => {
    const trimmedCaseName = caseName.trim();
    const trimmedDescription = description.trim();

    if (!trimmedCaseName || !lawyer || !client) {
      setSubmitFeedback({
        variant: "warning",
        message: "Please complete all required fields with valid values.",
      });
      return;
    }

    if (trimmedCaseName.length > 255) {
      setSubmitFeedback({
        variant: "warning",
        message: "Case name cannot exceed 255 characters.",
      });
      return;
    }

    if (!trimmedDescription) {
      setSubmitFeedback({
        variant: "warning",
        message: "Case description is required.",
      });
      return;
    }

    for (const stage of STAGES) {
      const selectedItems = getStageSelectedItems(stage);

      if (selectedItems.length === 0) {
        setSubmitFeedback({
          variant: "warning",
          message: `${stage} phase requires at least one Type of Work selection.`,
        });
        return;
      }

      if (selectedItems.length > 5) {
        setSubmitFeedback({
          variant: "warning",
          message: `${stage} phase can only contain up to 5 Type of Work items.`,
        });
        return;
      }

      const hasInvalidRange = selectedItems.some(
        (item) =>
          !Number.isFinite(item.rangeMin) ||
          !Number.isFinite(item.rangeMax) ||
          item.rangeMin < 0 ||
          item.rangeMax < 0 ||
          item.rangeMin > item.rangeMax
      );

      if (hasInvalidRange) {
        setSubmitFeedback({
          variant: "warning",
          message: `${stage} phase contains an invalid fee range.`,
        });
        return;
      }

      for (const item of selectedItems) {
        const optionKey = getOptionKey(item);
        const enteredRaw = selectedTypeOfWorkAmounts[stage]?.[optionKey] ?? "";
        const enteredAmount = Number(enteredRaw);

        if (enteredRaw === "" || !Number.isFinite(enteredAmount) || enteredAmount <= 0) {
          setSubmitFeedback({
            variant: "warning",
            message: `${stage} phase: enter a valid amount for "${item.typeOfWork}".`,
          });
          return;
        }

        if (enteredAmount < item.rangeMin || enteredAmount > item.rangeMax) {
          setSubmitFeedback({
            variant: "warning",
            message: `${stage} phase: amount for "${item.typeOfWork}" must be within ${item.rangeMin} - ${item.rangeMax}.`,
          });
          return;
        }
      }

      if (getStageAmount(stage) <= 0) {
        setSubmitFeedback({
          variant: "warning",
          message: `${stage} phase amount cannot be zero.`,
        });
        return;
      }
    }

    setLoading(true);
    setSubmitFeedback(null);

    try {
      const caseTypeFeeJson = STAGES.reduce((acc, stage) => {
        const selectedItems = getStageSelectedItems(stage);

        acc[stage] = selectedItems.map((item) => ({
          optionKey: getOptionKey(item),
          practiceArea: item.practiceArea,
          typeOfWork: item.typeOfWork,
          selectedFee: getEnteredAmount(stage, getOptionKey(item)),
          estimationFeesRange: item.estimationFeesRange,
          rangeMin: item.rangeMin,
          rangeMax: item.rangeMax,
        }));

        return acc;
      }, {} as Record<StageKey, Array<Record<string, string | number>>>);

      const expectedPayments = STAGES.reduce((acc, stage) => {
        acc[stage] = String(getStageAmount(stage));
        return acc;
      }, {} as Record<StageKey, string>);

      const payload = {
        title: trimmedCaseName,
        caseType,
        description: trimmedDescription,
        lawyerID: lawyer.firmID,
        clientID: client.firmID,
        case_type_fee_json: caseTypeFeeJson,
        expected_initial_payment: Number(expectedPayments.initial || 0),
        expected_first_payment: Number(expectedPayments.first || 0),
        expected_second_payment: Number(expectedPayments.second || 0),
        expected_third_payment: Number(expectedPayments.third || 0),
        expected_final_payment: Number(expectedPayments.final || 0),
      };

      const response = await axiosUser.post("/registercases", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      setSubmitFeedback({
        variant: "success",
        message: "Case registered successfully!",
      });

      if (onCaseAssigned) {
        onCaseAssigned(response.data.caseId);
      }

      window.setTimeout(() => {
        setLoading(false);
        handleClose();
      }, 650);
    } catch (error: any) {
      console.error(error);

      const fallbackMessage =
        error?.response?.status === 422
          ? "Validation failed. Check lawyer and client selection."
          : error?.response?.status === 404
            ? "Lawyer or client not found."
            : "Server error occurred. Please check the data.";

      setSubmitFeedback({
        variant: "danger",
        message: createFailureMessage("assign case", error, fallbackMessage),
      });
      setLoading(false);
    }
  };

  return (
    <Offcanvas
      show={show}
      onHide={handleTryClose}
      placement="end"
      backdrop="static"
      keyboard={false}
      className="assign-case-offcanvas"
    >
      <Offcanvas.Header closeButton className="assign-case-header">
        <Offcanvas.Title className="assign-case-title-wrap">
          <h2>Assign Case</h2>
          <p>
            Create a case for <strong>{selectedClientDisplay}</strong> using the same registration flow.
          </p>
        </Offcanvas.Title>
      </Offcanvas.Header>

      <Offcanvas.Body className="assign-case-body">
        {showAlert && (
          <Alert
            variant="danger"
            dismissible
            onClose={() => setShowAlert(false)}
            className="assign-case-alert"
          >
            <Alert.Heading>Unsaved Changes</Alert.Heading>
            <p>If you close this panel, entered case information will be lost.</p>
            <div className="d-flex justify-content-end">
              <Button onClick={handleClose} variant="outline-danger" size="sm">
                Discard and Close
              </Button>
            </div>
          </Alert>
        )}

        {submitFeedback && (
          <Alert
            variant={submitFeedback.variant as "success" | "danger" | "warning" | "info"}
            dismissible
            onClose={() => setSubmitFeedback(null)}
            className="assign-case-alert"
          >
            {submitFeedback.message}
          </Alert>
        )}

        {selectedCase && (
          <div className="assign-case-card">
            <div className="assign-case-card-header">
              <div>
                <h3>Case Registration Form</h3>
                <p>Create a case with assigned parties and expected payment phases.</p>
              </div>
              <span className="assign-case-badge">Step 1 of 1</span>
            </div>

            <div className="assign-case-card-body">
              <Page1Form
                caseName={caseName}
                setCaseName={setCaseName}
                caseType={caseType}
                setCaseType={setCaseType}
                feeOptions={feeOptions}
                feeOptionsLoading={feeOptionsLoading}
                feeOptionsError={feeOptionsError}
                selectedTypeOfWorkValues={selectedTypeOfWorkValues}
                onSelectedTypeOfWorkValuesChange={setSelectedTypeOfWorkValues}
                selectedTypeOfWorkAmounts={selectedTypeOfWorkAmounts}
                onSelectedTypeOfWorkAmountsChange={setSelectedTypeOfWorkAmounts}
                stageAmounts={{
                  initial: getStageAmount("initial"),
                  first: getStageAmount("first"),
                  second: getStageAmount("second"),
                  third: getStageAmount("third"),
                  final: getStageAmount("final"),
                }}
                onResetExpectedPayments={handleResetExpectedPayments}
                description={description}
                setDescription={setDescription}
                lawyer={lawyer}
                setLawyer={setLawyer}
                lawyerOptions={lawyerOptions}
                client={client}
                setClient={setClient}
                clientOptions={clientOptions}
              />
            </div>
          </div>
        )}

        <div className="assign-case-footer">
          <Button
            variant="success"
            type="button"
            className="assign-case-save-btn"
            disabled={loading || !selectedCase}
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              "Save Case"
            )}
          </Button>
        </div>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default AddCaseOffcanvas;