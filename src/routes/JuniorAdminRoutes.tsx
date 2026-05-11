import { RouteObject } from "react-router-dom";
import PATH from "../constant/paths";

import Dashboard from "../features/Admin/Pages/Dashboard";
import ManageCase from "../features/Admin/Pages/Manage Case/Display Case";
import ManageUser from "../features/Admin/Pages/Manage User/Manage";
import RegisterUser from "../features/Admin/Pages/Manage User/Register";
import RegisterCase from "../features/Admin/Pages/Manage Case/Register Case";
import AdminScheduleMeeting from "../features/Admin/Pages/ScheduleMeeting";
import InternalChatbot from "../pages/Chatbot/InternalChatbot";

const juniorAdminRoutes: RouteObject[] = [
  { path: PATH.ADMIN.DASHBOARD, element: <Dashboard /> },
  { path: PATH.ADMIN.SCHEDULE_MEETING, element: <AdminScheduleMeeting /> },
  { path: PATH.ADMIN.MANAGE_CASE, element: <ManageCase /> },
  { path: PATH.ADMIN.REGISTER_CASE, element: <RegisterCase /> },
  { path: PATH.ADMIN.MANAGE_USER, element: <ManageUser /> },
  { path: PATH.ADMIN.REGISTER_USER, element: <RegisterUser /> },
  { path: PATH.ADMIN.CHATBOT, element: <InternalChatbot userTypeLabel="Junior Admin" /> },
];

export default juniorAdminRoutes;
