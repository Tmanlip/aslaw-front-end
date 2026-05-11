import { Navigate, useRoutes } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import HomePage from "../pages/Home";
import AppRoutes from "./AppRouter";
import chatbotRoutes from "./ChatbotRoutes";
import ForgotPasswordPage from "../pages/ForgotPassword"
import ArchivedUserPage from "../pages/ArchivedUser";
import InactiveUserPage from "../pages/InactiveUser";
import PATH from "../constant/paths";

export default function RenderRouter() {
  const { role, user, loading, isArchived, isInactive } = useAuth();
  const effectiveRole = (role || String(user?.role || "").toLowerCase() || null) as
    | "admin"
    | "junioradmin"
    | "client"
    | "lawyer"
    | null;

  // 1. Define specific public routes
  const publicRoutes = [
    { path: "/", element: <HomePage /> },
    { path: PATH.AUTH.RESET_PASSWORD, element: <ForgotPasswordPage /> },
    ...chatbotRoutes,
  ];

  // 2. Get role-based routes
  const roleRoutes = loading
    ? []
    : isArchived && effectiveRole
      ? [{ path: "*", element: <ArchivedUserPage /> }]
      : isInactive && effectiveRole
      ? [{ path: "*", element: <InactiveUserPage /> }]
      : AppRoutes(effectiveRole);

  // 3. Combine them, but handle the 404/Catch-all carefully
  const element = useRoutes([
    { path: "/0/document-generator/*", element: <Navigate to={PATH.DOCUMENT_GENERATOR.DASHBOARD} replace /> },
    ...roleRoutes, 
    ...publicRoutes,
    // Only catch-all if NOT loading, otherwise it might snap back to Home too fast
    { path: "*", element: loading ? <div>Loading...</div> : <HomePage /> }
  ]);

  if (loading) return <div>Loading...</div>;

  return element;
}