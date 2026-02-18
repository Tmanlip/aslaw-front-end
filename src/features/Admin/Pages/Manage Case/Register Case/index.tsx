import React from "react";
import { Container } from "@mui/material";
import NavBarAdmin from "../../../../../shared/Navbar/NavBar Admin/new";
import CaseForm from "./components/CaseForm";

const RegisterCasePage: React.FC = () => {
  return (
    <>
      <NavBarAdmin />
      <Container sx={{ marginTop: 5 }}>
        <CaseForm />
      </Container>
    </>
  );
};

export default RegisterCasePage;