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
import AdminScheduleMeeting from "../features/Admin/Pages/ScheduleMeeting";
import AdminSearch from "../features/Admin/Pages/Search/index";
import GeneratorDashboard from "../document-generator/pages/Dashboard";
import GeneratorTemplateForm from "../document-generator/pages/TemplateForm";

const adminStaffRoutes: RouteObject[] = [
  { path: PATH.ADMIN_STAFF.DASHBOARD, element: <Dashboard /> },
  { path: PATH.ADMIN_STAFF.MY_PROFILE, element: <AdminProfile /> },
  { path: PATH.ADMIN_STAFF.SCHEDULE_MEETING, element: <AdminScheduleMeeting /> },
  { path: PATH.ADMIN_STAFF.BILLING, element: <Billing /> },
  { path: PATH.ADMIN_STAFF.MANAGE_CASE, element: <ManageCase /> },
  { path: PATH.ADMIN_STAFF.EDIT_CASE, element: <EditCase /> },
  { path: PATH.ADMIN_STAFF.REGISTER_CASE, element: <RegisterCase /> },
  { path: PATH.ADMIN_STAFF.MANAGE_USER, element: <ManageUser /> },
  { path: PATH.ADMIN_STAFF.REGISTER_USER, element: <RegisterUser /> },
  { path: PATH.ADMIN_STAFF.MANAGE_PROFILE, element: <ManageProfile /> },
  { path: PATH.ADMIN_STAFF.LAWYER_BILLING, element: <LawyerCases /> },
  { path: PATH.ADMIN_STAFF.SEARCH, element: <AdminSearch /> },
  { path: PATH.DOCUMENT_GENERATOR.DASHBOARD, element: <GeneratorDashboard /> },
  { path: PATH.DOCUMENT_GENERATOR.TEMPLATE, element: <GeneratorTemplateForm /> },
];

export default adminStaffRoutes;
