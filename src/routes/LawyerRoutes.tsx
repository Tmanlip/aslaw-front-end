import { RouteObject } from "react-router-dom";
import PATH from "../constant/paths";

import Dashboard from "../features/Lawyer/Pages/Dashboard";
import UpdateCase from "../features/Lawyer/Pages/Update Case";
import Profile from "../features/Lawyer/Pages/My Profile";

const lawyerRoutes: RouteObject[] = [
  { path: PATH.LAWYER.DASHBOARD, element: <Dashboard /> },
  { path: PATH.LAWYER.UPDATE_CASE, element: <UpdateCase /> },
  { path: PATH.LAWYER.MY_PROFILE, element: <Profile />},
];

export default lawyerRoutes;
