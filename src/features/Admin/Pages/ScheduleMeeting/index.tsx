import React from "react";
import NavBarAdmin from "../../../../shared/Navbar/NavBar Admin/new";
import MeetingScheduler from "../../../Shared/MeetingScheduler/MeetingScheduler";
import { useAuth } from "../../../../context/AuthContext";

const AdminScheduleMeeting: React.FC = () => {
  const { role, user } = useAuth();
  const effectiveRole = (role || String(user?.role || "").toLowerCase()) as "admin" | "adminstaff" | "junioradmin" | "client" | "lawyer";

  return (
    <>
      <NavBarAdmin />
      <MeetingScheduler role={effectiveRole === "junioradmin" ? "junioradmin" : "admin"} />
    </>
  );
};

export default AdminScheduleMeeting;