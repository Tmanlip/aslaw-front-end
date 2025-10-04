import { RouteObject } from "react-router-dom";
import PATH from "../constant/paths";

import ChatbotPage from "../pages/Chatbot";

const chatbotRoutes: RouteObject[] = [
  { path: PATH.CHATBOT.ROOT, element: <ChatbotPage /> },
];

export default chatbotRoutes;
