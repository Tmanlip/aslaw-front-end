import React, { useEffect, useState } from "react";
import NavBarClient from "../../../../shared/Navbar/NavBar Client/new";
import AuthMemory from "../../../../data/authMemory";
import { fetchClientFullData } from "../../../../hooks/clientApi";
import ProfileInfo from "./ProfileInfo"; // <-- the component
import { ClientFullData } from "../../../../data/userInfo";
import "./profile.css";

const ClientProfile: React.FC = () => {
  const [data, setData] = useState<ClientFullData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const firmID = AuthMemory.getUser()?.firmID;
    if (firmID) {
      fetchClientFullData(firmID)
        .then((res) => setData(res))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <>
        <NavBarClient />
        <div className="client-profile-state">Loading client data...</div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <NavBarClient />
        <div className="client-profile-state">No client data available.</div>
      </>
    );
  }

  return (
    <>
      <NavBarClient />
      <div className="client-profile-page">
        <div className="client-profile-sidebar">
          <img
            src={data.client.photo || "src/assets/pics/Gambar Passport-min.jpeg"}
            alt="Passport"
            className="client-profile-avatar"
          />
          <h1 className="client-profile-title">Welcome {data.client.name}</h1>
          <p className="client-profile-email">{data.client.email}</p>
        </div>

        <div className="client-profile-content">
          <ProfileInfo />
        </div>
      </div>
    </>
  );
};

export default ClientProfile;
