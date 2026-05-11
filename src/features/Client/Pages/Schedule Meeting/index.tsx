import React from "react";
import NavBarClient from "../../../../shared/Navbar/NavBar Client/new";
import MeetingScheduler from "../../../Shared/MeetingScheduler/MeetingScheduler";

const ClientScheduleMeeting: React.FC = () => {
  return (
    <>
      <NavBarClient />
      <MeetingScheduler role="client" />
    </>
  );
};

export default ClientScheduleMeeting;
