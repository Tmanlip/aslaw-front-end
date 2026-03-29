import { RouteObject } from "react-router-dom";
import PATH from "../constant/paths";

import Dashboard from "../features/Client/Pages/Dashboard";
import Profile from "../features/Client/Pages/My Profile";
import ViewCase from "../features/Client/Pages/View Case";
import InternalChatbot from "../pages/Chatbot/InternalChatbot";

const clientRoutes: RouteObject[] = [
  { path: PATH.CLIENT.DASHBOARD, element: <Dashboard /> },
  { path: PATH.CLIENT.MY_PROFILE, element: <Profile /> },
  { path: PATH.CLIENT.VIEW_CASE, element: <ViewCase />},
  { path: PATH.CLIENT.CHATBOT, element: <InternalChatbot userTypeLabel="Client" /> }
];

export default clientRoutes;
