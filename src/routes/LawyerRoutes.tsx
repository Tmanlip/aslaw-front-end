import { RouteObject } from "react-router-dom";
import PATH from "../constant/paths";

import Dashboard from "../features/Lawyer/Pages/Dashboard";
import UpdateCase from "../features/Lawyer/Pages/Update Case";
import Profile from "../features/Lawyer/Pages/My Profile";
import GeneratorDashboard from "../document-generator/pages/Dashboard";
import GeneratorTemplateForm from "../document-generator/pages/TemplateForm";

const lawyerRoutes: RouteObject[] = [
  { path: PATH.LAWYER.DASHBOARD, element: <Dashboard /> },
  { path: PATH.LAWYER.UPDATE_CASE, element: <UpdateCase /> },
  { path: PATH.LAWYER.MY_PROFILE, element: <Profile />},
  { path: PATH.DOCUMENT_GENERATOR.DASHBOARD, element: <GeneratorDashboard /> },
  { path: PATH.DOCUMENT_GENERATOR.TEMPLATE, element: <GeneratorTemplateForm /> },
];

export default lawyerRoutes;
