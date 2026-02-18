import { useRoutes } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import HomePage from "../pages/Home";
import AppRoutes from "./AppRouter";
import chatbotRoutes from "./ChatbotRoutes";
import ForgotPasswordPage from "../pages/ForgotPassword"

export default function RenderRouter() {
  const { role, loading } = useAuth();

  const publicRoutes = [
    { path: "/", element: <HomePage /> },
    { path: "/reset_password", element: <ForgotPasswordPage /> },
    ...chatbotRoutes,
    { path: "*", element: <HomePage /> },
  ];

  // ⛔ While loading, do NOT mount role routes
  const roleRoutes = loading ? [] : AppRoutes(role);

  // 🔁 Hooks must always run
  const element = useRoutes([...roleRoutes, ...publicRoutes]);

  // ✅ Now it's safe to conditionally render
  if (loading) {
    return <div>Loading...</div>; // spinner ok
  }

  return element;
}