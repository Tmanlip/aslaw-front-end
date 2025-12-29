import React, { useEffect, useState } from "react";
import axios from "axios";
import NavBarAdmin from "../../../../../../shared/Navbar/NavBar Admin/new";
import Page1Form from "./pageoneform";
import { UserRole} from "../../../../../../constant/user";

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
  const [caseName, setCaseName] = useState("");
  const [description, setDescription] = useState("");

  const [lawyer, setLawyer] = useState<User | null>(null);
  const [client, setClient] = useState<User | null>(null);

  const [lawyerOptions, setLawyerOptions] = useState<User[]>([]);
  const [clientOptions, setClientOptions] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get<User[]>(
          "http://127.0.0.1:8000/api/users"
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

    const res = await axios.post(
      `${process.env.REACT_APP_API_URL}/registercases`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    alert("Case created successfully!");
    setCaseName("");
    setDescription("");
    setLawyer(null);
    setClient(null);

  } catch (error: any) {
    console.error(error);

    // Handle HTTP errors
    if (error.response) {
      const status = error.response.status;

      if (status === 422) {
        // Validation error
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
      // No response received
      alert("No response from server. Check your connection.");
    } else {
      // Other errors
      alert("Error: " + error.message);
    }
  }
};

  return (
    <>
      <NavBarAdmin />

      <div style={{ padding: "2rem" }}>
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

        <button className="btn btn-success mt-3" onClick={handleSubmit}>
          Submit Case
        </button>
      </div>
    </>
  );
};

export default RegisterCase;