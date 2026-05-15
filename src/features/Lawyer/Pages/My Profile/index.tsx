import React, { useEffect, useState } from "react";
import NavBarLawyer from "../../../../shared/Navbar/NavBar Lawyer/new";
import AuthMemory from "../../../../data/authMemory";
import { fetchLawyerFullData } from "../../../../hooks/lawyerApi";
import ProfileInfo from "./ProfileInfo";
import { LawyerFullData } from "../../../../data/userInfo";
import { userData } from "../../../../data/userData";
import "./profile.css";

const LawyerProfile: React.FC = () => {
  const [data, setData] = useState<LawyerFullData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const firmID = AuthMemory.getUser()?.firmID;
    if (firmID) {
      fetchLawyerFullData(firmID)
        .then((res) => {
          setData(res);
          AuthMemory.setLawyerFullData(res); // optional: store in AuthMemory
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <>
        <NavBarLawyer />
        <div className="lawyer-profile-state">Loading lawyer data...</div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <NavBarLawyer />
        <div className="lawyer-profile-state">No lawyer data available.</div>
      </>
    );
  }

  const lawyerStatus = data.lawyer.status || "Active";

  return (
    <>
      <NavBarLawyer />
      <div className="lawyer-profile-page">
        <div className="lawyer-profile-sidebar">
          <img
            src={data.lawyer.photo || userData.photo}
            alt="Passport"
            className="lawyer-profile-avatar"
          />
          <h1 className="lawyer-profile-title">Welcome {data.lawyer.name}</h1>
          <p className="lawyer-profile-email">{data.lawyer.email}</p>
          <div className="lawyer-profile-meta">
            <span className="lawyer-profile-meta-item">Firm ID: {data.lawyer.firmID || "-"}</span>
            <span className={`lawyer-profile-status ${String(lawyerStatus).toLowerCase() === "inactive" ? "is-inactive" : "is-active"}`}>
              {lawyerStatus}
            </span>
          </div>
        </div>

        <div className="lawyer-profile-content">
          <ProfileInfo fullData={data} />
        </div>
      </div>
    </>
  );
};

export default LawyerProfile;