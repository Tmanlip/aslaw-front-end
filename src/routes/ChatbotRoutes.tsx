import { RouteObject } from "react-router-dom";
import PATH from "../constant/paths";

import ChatbotPage from "../pages/Chatbot";
import InternalChatbot from "../pages/Chatbot/InternalChatbot";

const chatbotRoutes: RouteObject[] = [
  { path: PATH.CHATBOT.ROOT, element: <ChatbotPage /> },
  { path: PATH.ADMIN.CHATBOT, element: <InternalChatbot userTypeLabel="Admin" /> },
  { path: PATH.JUNIOR_ADMIN.CHATBOT, element: <InternalChatbot userTypeLabel="Junior Admin" /> },
  { path: PATH.CLIENT.CHATBOT, element: <InternalChatbot userTypeLabel="Client" /> },
  { path: PATH.LAWYER.CHATBOT, element: <InternalChatbot userTypeLabel="Lawyer" /> },
];

export default chatbotRoutes;
