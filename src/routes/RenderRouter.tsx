import { useRoutes } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import HomePage from "../pages/Home";
import AppRoutes from "./AppRouter";
import chatbotRoutes from "./ChatbotRoutes";
import ForgotPasswordPage from "../pages/ForgotPassword"

export default function RenderRouter() {
  const { role, loading } = useAuth();

  // 1. Define specific public routes
  const publicRoutes = [
    { path: "/", element: <HomePage /> },
    { path: "/reset_password", element: <ForgotPasswordPage /> },
    ...chatbotRoutes,
  ];

  // 2. Get role-based routes
  const roleRoutes = loading ? [] : AppRoutes(role);

  // 3. Combine them, but handle the 404/Catch-all carefully
  const element = useRoutes([
    ...roleRoutes, 
    ...publicRoutes,
    // Only catch-all if NOT loading, otherwise it might snap back to Home too fast
    { path: "*", element: loading ? <div>Loading...</div> : <HomePage /> }
  ]);

  if (loading) return <div>Loading...</div>;

  return element;
}