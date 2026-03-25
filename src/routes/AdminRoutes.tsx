import { RouteObject } from "react-router-dom";
import PATH from "../constant/paths";

import Dashboard from "../features/Admin/Pages/Dashboard";
import Billing from "../features/Admin/Pages/Billing";
import ManageCase from "../features/Admin/Pages/Manage Case/Display Case";
import ManageUser from "../features/Admin/Pages/Manage User/Manage";
import RegisterUser from "../features/Admin/Pages/Manage User/Register";
import ManageProfile from "../features/Admin/Pages/Manage User/Manage/Manage Profile";
import EditCase from "../features/Admin/Pages/Manage Case/Edit Case";
import LawyerCases from "../features/Admin/Pages/Billing/LawyerBilling";
import RegisterCase from "../features/Admin/Pages/Manage Case/Register Case";
import AdminProfile from "../features/Admin/Pages/My Profile";
import AdminLogs from "../features/Admin/Pages/Logs/index";

const adminRoutes: RouteObject[] = [
  { path: PATH.ADMIN.DASHBOARD, element: <Dashboard /> },
  { path: PATH.ADMIN.MY_PROFILE, element: <AdminProfile /> },
  { path: PATH.ADMIN.BILLING, element: <Billing /> },
  { path: PATH.ADMIN.MANAGE_CASE, element: <ManageCase /> },
  { path: PATH.ADMIN.EDIT_CASE, element: <EditCase />},
  { path: PATH.ADMIN.REGISTER_CASE, element: <RegisterCase />},
  { path: PATH.ADMIN.MANAGE_USER, element: <ManageUser /> },
  { path: PATH.ADMIN.REGISTER_USER, element: <RegisterUser />},
  { path: PATH.ADMIN.MANAGE_PROFILE, element: <ManageProfile />},
  { path: PATH.ADMIN.LAWYER_BILLING, element: <LawyerCases />},
  { path: PATH.ADMIN.LOGS, element: <AdminLogs />}
];

export default adminRoutes;
