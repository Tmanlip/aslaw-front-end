import React from "react";
import NavBarLawyer from "../../../../shared/Navbar/NavBar Lawyer/new";
import MeetingScheduler from "../../../Shared/MeetingScheduler/MeetingScheduler";

const LawyerScheduleMeeting: React.FC = () => {
  return (
    <>
      <NavBarLawyer />
      <MeetingScheduler role="lawyer" />
    </>
  );
};

export default LawyerScheduleMeeting;
