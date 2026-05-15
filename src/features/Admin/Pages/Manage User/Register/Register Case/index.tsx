import React, { useEffect, useState } from "react";
import axiosUser from "../../../../../../api/axiosUser";
import { useNavigate } from "react-router-dom";
import Spinner from "react-bootstrap/Spinner";
import CustomAlert from "../../../../../../components/NormalAlert/Alerts";

import NavBarAdmin from "../../../../../../shared/Navbar/NavBar Admin/new";
import Page1Form from "./pageoneform";
import { createFailureMessage } from "../feedback";
import { UserRole } from "../../../../../../constant/user";
import PATH from "../../../../../../constant/paths";
import "./registerCase.css";

export type User = {
  id: number;
  name: string;
  role: UserRole;
  firmID: string;
};

type StageKey = "initial" | "first" | "second" | "third" | "final";
type CaseType = "Litigation" | "Criminal" | "Corporate";

export type FeeOption = {
  practiceArea: string;
  typeOfWork: string;
  estimationFeesRange: string;
  estimatedAmount: number;
  rangeMin: number;
  rangeMax: number;
};

type StageSelections = Record<StageKey, string[]>;
type StageAmountInputs = Record<StageKey, Record<string, string>>;

const STAGES: StageKey[] = ["initial", "first", "second", "third", "final"];

const STAGE_LABELS: Record<StageKey, string> = {
  initial: "Initial",
  first: "First",
  second: "Second",
  third: "Third",
  final: "Final",
};

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

type RegisterCaseProps = {
  user?: User;
};

const RegisterCase: React.FC<RegisterCaseProps> = ({ user }) => {
  const navigate = useNavigate();
  const SUCCESS_REDIRECT_DELAY_MS = 1200;

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
  const [feedback, setFeedback] = useState<{ variant: string; message: string } | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axiosUser.get<User[]>("/users");

        setLawyerOptions(res.data.filter((u) => u.role === "lawyer"));
        setClientOptions(res.data.filter((u) => u.role === "client"));
      } catch (err) {
        console.error("Failed to fetch users", err);
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
      } catch (err: any) {
        console.error("Failed to fetch type of work options", err);
        setFeeOptions([]);
        const status = Number(err?.response?.status || 0);
        const backendMessage = String(err?.response?.data?.message || "").trim();
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

  const handleSubmit = async () => {
    const trimmedCaseName = caseName.trim();
    const trimmedDescription = description.trim();

    if (!trimmedCaseName || !lawyer || !client) {
      setFeedback({
        variant: "warning",
        message: "Please complete all required fields with valid values.",
      });
      return;
    }

    if (trimmedCaseName.length > 255) {
      setFeedback({
        variant: "warning",
        message: "Case name cannot exceed 255 characters.",
      });
      return;
    }

    if (!trimmedDescription) {
      setFeedback({
        variant: "warning",
        message: "Case description is required.",
      });
      return;
    }

    for (const stage of STAGES) {
      const stageLabel = STAGE_LABELS[stage];
      const selectedItems = getStageSelectedItems(stage);

      if (selectedItems.length === 0) {
        setFeedback({
          variant: "warning",
          message: `${stageLabel} phase requires at least one Type of Work selection.`,
        });
        return;
      }

      if (selectedItems.length > 5) {
        setFeedback({
          variant: "warning",
          message: `${stageLabel} phase can only contain up to 5 Type of Work items.`,
        });
        return;
      }

      const hasInvalidRange = selectedItems.some((item) => !Number.isFinite(item.rangeMin) || !Number.isFinite(item.rangeMax) || item.rangeMin < 0 || item.rangeMax < 0 || item.rangeMin > item.rangeMax);
      if (hasInvalidRange) {
        setFeedback({
          variant: "warning",
          message: `${stageLabel} phase contains an invalid fee range.`,
        });
        return;
      }

      for (const item of selectedItems) {
        const optionKey = getOptionKey(item);
        const enteredRaw = selectedTypeOfWorkAmounts[stage]?.[optionKey] ?? "";
        const enteredAmount = Number(enteredRaw);

        if (enteredRaw === "" || !Number.isFinite(enteredAmount) || enteredAmount <= 0) {
          setFeedback({
            variant: "warning",
            message: `${stageLabel} phase: enter a valid amount for "${item.typeOfWork}".`,
          });
          return;
        }

        if (enteredAmount < item.rangeMin || enteredAmount > item.rangeMax) {
          setFeedback({
            variant: "warning",
            message: `${stageLabel} phase: amount for "${item.typeOfWork}" must be within ${item.rangeMin} - ${item.rangeMax}.`,
          });
          return;
        }
      }

      const stageAmount = getStageAmount(stage);
      if (stageAmount <= 0) {
        setFeedback({
          variant: "warning",
          message: `${stageLabel} phase amount cannot be zero.`,
        });
        return;
      }
    }

    setLoading(true);

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

      await axiosUser.post(
        "/registercases",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      setFeedback({
        variant: "success",
        message: "Case registered successfully!",
      });

      // Reset form (optional)
      setCaseType("Litigation");
      setFeeOptions([]);
      setSelectedTypeOfWorkValues(buildEmptyStageSelections());
      setSelectedTypeOfWorkAmounts(buildEmptyStageAmountInputs());
      setCaseName("");
      setDescription("");
      setLawyer(null);
      setClient(null);

      // Let users see success feedback before redirecting.
      window.setTimeout(() => {
        navigate(user ? PATH.ADMIN.MANAGE_USER : PATH.ADMIN.MANAGE_CASE);
      }, SUCCESS_REDIRECT_DELAY_MS);

    } catch (error: any) {
      console.error(error);

      const fallbackMessage =
        error?.response?.status === 422
          ? "Validation failed. Check lawyer and client selection."
          : error?.response?.status === 404
            ? "Lawyer or client not found."
            : "Server error occurred. Please check the data.";

      setFeedback({
        variant: "danger",
        message: createFailureMessage("register case", error, fallbackMessage),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavBarAdmin />

      <div className="admin-register-case-page">
        <div className="admin-register-case-header">
          <h1>Register Case</h1>
          <p>Create a case record with assigned parties and payment milestones.</p>
        </div>

        {feedback && (
          <div className="mb-3">
            <CustomAlert
              variant={feedback.variant}
              message={feedback.message}
              onClose={() => setFeedback(null)}
            />
          </div>
        )}

        <div className="admin-register-case-card">
          <div className="admin-register-case-card-header">
            <div>
              <h2>Case Registration Form</h2>
              <p>Create a case with assigned parties and expected payment phases.</p>
            </div>

            {user && (
              <div className="admin-register-case-banner">
                <div>
                  <span className="admin-register-case-banner-label">New Client</span>
                  <strong>{user.name}</strong>
                </div>
                <div>
                  <span className="admin-register-case-banner-label">Firm ID</span>
                  <strong>{user.firmID}</strong>
                </div>
              </div>
            )}
          </div>

          <div className="admin-register-case-card-body">
            <div className="admin-register-case-form-wrap">
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

          <div className="admin-register-case-footer">
            <button
              className="btn btn-success admin-register-case-submit"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                  Submitting...
                </>
              ) : (
                "Submit Case"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterCase;