import React from "react";
import NavBarAdmin from "../../../../shared/Navbar/NavBar Admin/new";
import MeetingScheduler from "../../../Shared/MeetingScheduler/MeetingScheduler";

const AdminScheduleMeeting: React.FC = () => {
  return (
    <>
      <NavBarAdmin />
      <MeetingScheduler role="admin" />
    </>
  );
};

export default AdminScheduleMeeting;