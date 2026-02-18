import React, { useEffect, useState } from "react";
import NavBarLawyer from "../../../../shared/Navbar/NavBar Lawyer/new";
import AuthMemory from "../../../../data/authMemory";
import { fetchLawyerFullData } from "../../../../hooks/lawyerApi";
import ProfileInfo from "./ProfileInfo";
import { LawyerFullData } from "../../../../data/userInfo";

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
        <div style={{ padding: "2rem" }}>Loading lawyer data...</div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <NavBarLawyer />
        <div style={{ padding: "2rem" }}>No lawyer data available.</div>
      </>
    );
  }

  return (
    <>
      <NavBarLawyer />
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
            src={data.lawyer.photo || "src/assets/pics/Gambar Passport-min.jpeg"}
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
          <h1>Welcome {data.lawyer.name}</h1>
          <p>{data.lawyer.email}</p>
        </div>

        {/* Right Column: ProfileInfo Component */}
        <div style={{ flex: 1 }}>
          <ProfileInfo fullData={data} />
        </div>
      </div>
    </>
  );
};

export default LawyerProfile;