import React, { useEffect, useState } from "react";
import NavBarClient from "../../../../shared/Navbar/NavBar Client/new";
import AuthMemory from "../../../../data/authMemory";
import { fetchClientFullData } from "../../../../hooks/clientApi";
import ProfileInfo from "./ProfileInfo"; // <-- the component
import { ClientFullData } from "../../../../data/userInfo";

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
        <div style={{ padding: "2rem" }}>Loading client data...</div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <NavBarClient />
        <div style={{ padding: "2rem" }}>No client data available.</div>
      </>
    );
  }

  return (
    <>
      <NavBarClient />
      <div style={{ display: "flex", padding: "2rem", gap: "2rem" }}>
        {/* Left Column: Photo + Welcome */}
        <div
          style={{
            flexShrink: 0,
            textAlign: "center",
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            position: "sticky",
            top: 0,
          }}
        >
          <img
            src={data.client.photo || "src/assets/pics/Gambar Passport-min.jpeg"}
            alt="Passport"
            style={{
              width: "150px",
              height: "200px",
              objectFit: "cover",
              borderRadius: "8px",
              border: "2px solid #ccc",
              marginBottom: "1rem",
            }}
          />
          <h1>Welcome {data.client.name}</h1>
          <p>{data.client.email}</p>
        </div>

        {/* Right Column: ProfileInfo Component */}
        <div style={{ flex: 1 }}>
          <ProfileInfo />
        </div>
      </div>
    </>
  );
};

export default ClientProfile;
