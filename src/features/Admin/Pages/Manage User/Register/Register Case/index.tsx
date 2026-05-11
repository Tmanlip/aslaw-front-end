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

type RegisterCaseProps = {
  user?: User;
};

const RegisterCase: React.FC<RegisterCaseProps> = ({ user }) => {
  const navigate = useNavigate();
  const SUCCESS_REDIRECT_DELAY_MS = 1200;

  const getDefaultExpectedPayments = (type: "Litigation" | "Criminal" | "Corporate") => {
    switch (type) {
      case "Criminal":
        return { initial: "1200", first: "1800", second: "2000", third: "2200", final: "2800" };
      case "Corporate":
        return { initial: "3000", first: "4500", second: "5000", third: "5500", final: "7000" };
      case "Litigation":
      default:
        return { initial: "1500", first: "2500", second: "3000", third: "3000", final: "4000" };
    }
  };

  const [caseName, setCaseName] = useState("");
  const [caseType, setCaseType] = useState<"Litigation" | "Criminal" | "Corporate">("Litigation");
  const [description, setDescription] = useState("");
  const [expectedPayments, setExpectedPayments] = useState(getDefaultExpectedPayments("Litigation"));

  const [lawyer, setLawyer] = useState<User | null>(null);
  const [client, setClient] = useState<User | null>(null);

  const [lawyerOptions, setLawyerOptions] = useState<User[]>([]);
  const [clientOptions, setClientOptions] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ variant: string; message: string } | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axiosUser.get<User[]>(
          `${process.env.REACT_APP_API_URL}/users`
        );

        setLawyerOptions(res.data.filter((u) => u.role === "lawyer"));
        setClientOptions(res.data.filter((u) => u.role === "client"));
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    };

    fetchUsers();
  }, []);

  const handleResetExpectedPayments = () => {
    setExpectedPayments(getDefaultExpectedPayments(caseType));
  };

  const handleSubmit = async () => {
    if (!caseName || !lawyer || !client) {
      setFeedback({
        variant: "warning",
        message: "Please complete all required fields with valid values.",
      });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title: caseName,
        caseType,
        description,
        lawyerID: lawyer.firmID,
        clientID: client.firmID,
        expected_initial_payment: Number(expectedPayments.initial || 0),
        expected_first_payment: Number(expectedPayments.first || 0),
        expected_second_payment: Number(expectedPayments.second || 0),
        expected_third_payment: Number(expectedPayments.third || 0),
        expected_final_payment: Number(expectedPayments.final || 0),
      };

      await axiosUser.post(
        `${process.env.REACT_APP_API_URL}/registercases`,
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
      setExpectedPayments(getDefaultExpectedPayments("Litigation"));
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
                expectedPayments={expectedPayments}
                setExpectedPayments={setExpectedPayments}
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