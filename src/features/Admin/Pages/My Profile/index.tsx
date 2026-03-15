import React, { useEffect, useState } from "react";
import NavBarAdmin from "../../../../shared/Navbar/NavBar Admin/new";
import AuthMemory from "../../../../data/authMemory";
import ProfileInfo from "./ProfileInfo";
import { Lawyer } from "../../../../data/userInfo";

const normalizeAdminUser = (user: any): Lawyer => ({
  id: user?.id ?? 0,
  firmID: user?.firmID ?? "",
  name: user?.name ?? "",
  email: user?.email ?? "",
  username: user?.username ?? "",
  age: Number(user?.age ?? 0),
  ICNumber: user?.ICNumber ?? "",
  phoneNumber: user?.phoneNumber ?? "",
  HomeAddress: user?.HomeAddress ?? "",
  gender: user?.gender ?? "",
  maritalStatus: user?.maritalStatus ?? "",
  status: user?.status ?? "",
  created_at: user?.created_at ?? "",
  photo: user?.photo,
});

const AdminProfile: React.FC = () => {
  const [admin, setAdmin] = useState<Lawyer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authUser = AuthMemory.getUser();
    if (authUser) {
      setAdmin(normalizeAdminUser(authUser));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <>
        <NavBarAdmin />
        <div style={{ padding: "2rem" }}>Loading admin data...</div>
      </>
    );
  }

  if (!admin) {
    return (
      <>
        <NavBarAdmin />
        <div style={{ padding: "2rem" }}>No admin data available.</div>
      </>
    );
  }

  return (
    <>
      <NavBarAdmin />
      <div style={{ display: "flex", padding: "2rem", gap: "2rem" }}>
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
            src={admin.photo || "src/assets/pics/Gambar Passport-min.jpeg"}
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
          <h1>Welcome {admin.name}</h1>
          <p>{admin.email}</p>
        </div>

        <div style={{ flex: 1 }}>
          <ProfileInfo admin={admin} onAdminUpdated={setAdmin} />
        </div>
      </div>
    </>
  );
};

export default AdminProfile;
