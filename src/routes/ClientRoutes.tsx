import { RouteObject } from "react-router-dom";
import PATH from "../constant/paths";

import Dashboard from "../features/Client/Pages/Dashboard";
import Profile from "../features/Client/Pages/My Profile";
import ViewCase from "../features/Client/Pages/View Case";
import ScheduleMeeting from "../features/Client/Pages/ScheduleMeeting";
import InternalChatbot from "../pages/Chatbot/InternalChatbot";
import GeneratorDashboard from "../document-generator/pages/Dashboard";
import GeneratorTemplateForm from "../document-generator/pages/TemplateForm";

const clientRoutes: RouteObject[] = [
  { path: PATH.CLIENT.DASHBOARD, element: <Dashboard /> },
  { path: PATH.CLIENT.MY_PROFILE, element: <Profile /> },
  { path: PATH.CLIENT.VIEW_CASE, element: <ViewCase />},
  { path: PATH.CLIENT.SCHEDULE_MEETING, element: <ScheduleMeeting />},
  { path: PATH.CLIENT.CHATBOT, element: <InternalChatbot userTypeLabel="Client" /> },
  { path: PATH.DOCUMENT_GENERATOR.DASHBOARD, element: <GeneratorDashboard /> },
  { path: PATH.DOCUMENT_GENERATOR.TEMPLATE, element: <GeneratorTemplateForm /> },
];

export default clientRoutes;
