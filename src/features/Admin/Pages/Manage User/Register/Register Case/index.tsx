import React, { useEffect, useState } from "react";
import axiosUser from "../../../../../../api/axiosUser";
import { useNavigate } from "react-router-dom";

import NavBarAdmin from "../../../../../../shared/Navbar/NavBar Admin/new";
import Page1Form from "./pageoneform";
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
  user: User;
};

const RegisterCase: React.FC<RegisterCaseProps> = ({ user }) => {
  const navigate = useNavigate();

  const [caseName, setCaseName] = useState("");
  const [description, setDescription] = useState("");

  const [lawyer, setLawyer] = useState<User | null>(null);
  const [client, setClient] = useState<User | null>(null);

  const [lawyerOptions, setLawyerOptions] = useState<User[]>([]);
  const [clientOptions, setClientOptions] = useState<User[]>([]);

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

  const handleSubmit = async () => {
    if (!caseName || !lawyer || !client) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const payload = {
        title: caseName,
        description,
        lawyerID: lawyer.firmID,
        clientID: client.firmID,
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

      alert("Case created successfully!");

      // Reset form (optional)
      setCaseName("");
      setDescription("");
      setLawyer(null);
      setClient(null);

      // ✅ Redirect to Manage User page
      navigate(PATH.ADMIN.MANAGE_USER);

    } catch (error: any) {
      console.error(error);

      if (error.response) {
        const status = error.response.status;

        if (status === 422) {
          alert(
            error.response.data.error ||
              "Validation failed. Check lawyer and client selection."
          );
        } else if (status === 404) {
          alert(error.response.data.error || "Lawyer or client not found.");
        } else {
          alert(
            error.response.data.error ||
              "Server error occurred. Please check the data."
          );
        }
      } else if (error.request) {
        alert("No response from server. Check your connection.");
      } else {
        alert("Error: " + error.message);
      }
    }
  };

  return (
    <>
      <NavBarAdmin />

      <div className="admin-register-case-page">
        <h1>Register Case</h1>

        <div className="alert alert-info">
          <strong>New Client:</strong> {user.name} <br />
          <strong>Firm ID:</strong> {user.firmID}
        </div>

        <Page1Form
          caseName={caseName}
          setCaseName={setCaseName}
          description={description}
          setDescription={setDescription}
          lawyer={lawyer}
          setLawyer={setLawyer}
          lawyerOptions={lawyerOptions}
          client={client}
          setClient={setClient}
          clientOptions={clientOptions}
        />

        <button className="btn btn-success mt-3 admin-register-case-submit" onClick={handleSubmit}>
          Submit Case
        </button>
      </div>
    </>
  );
};

export default RegisterCase;