import { useRoutes } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import HomePage from "../pages/Home";
import AppRoutes from "./AppRouter"; // ✅ new central role-based routes
import chatbotRoutes from "./ChatbotRoutes";

export default function RenderRouter() {
  const { role } = useAuth();

  // Public routes (accessible without login)
  const publicRoutes = [
    { path: "/", element: <HomePage /> },
    ...chatbotRoutes,
    { path: "*", element: <HomePage /> }, // catch-all redirect to login
  ];

  // Role-based routes (admin, lawyer, client)
  const roleRoutes = AppRoutes(role);

  // Merge role routes + public routes
  const routes = [...roleRoutes, ...publicRoutes];

  return useRoutes(routes);
}
