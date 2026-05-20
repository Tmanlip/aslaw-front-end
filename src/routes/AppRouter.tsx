import adminRoutes from "./AdminRoutes";
import adminStaffRoutes from "./AdminStaffRoutes";
import juniorAdminRoutes from "./JuniorAdminRoutes";
import lawyerRoutes from "./LawyerRoutes";
import clientRoutes from "./ClientRoutes";

export default function AppRoutes(role: string | null) {
  switch (role) {
    case "admin":
      return adminRoutes;
    case "adminstaff":
      return adminStaffRoutes;
    case "junioradmin":
      return juniorAdminRoutes;
    case "lawyer":
      return lawyerRoutes;
    case "client":
      return clientRoutes;
    default:
      return []; // ✅ must return array
  }
}