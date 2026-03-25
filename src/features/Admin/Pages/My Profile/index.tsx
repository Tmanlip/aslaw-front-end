import React, { useEffect, useState } from "react";
import NavBarAdmin from "../../../../shared/Navbar/NavBar Admin/new";
import AuthMemory from "../../../../data/authMemory";
import ProfileInfo from "./ProfileInfo";
import { Lawyer } from "../../../../data/userInfo";
import "./profile.css";

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
        <div className="admin-profile-state">Loading admin data...</div>
      </>
    );
  }

  if (!admin) {
    return (
      <>
        <NavBarAdmin />
        <div className="admin-profile-state">No admin data available.</div>
      </>
    );
  }

  return (
    <>
      <NavBarAdmin />
      <div className="admin-profile-page">
        <div className="admin-profile-sidebar">
          <img
            src={admin.photo || "src/assets/pics/Gambar Passport-min.jpeg"}
            alt="Passport"
            className="admin-profile-avatar"
          />
          <h1 className="admin-profile-title">Welcome {admin.name}</h1>
          <p className="admin-profile-email">{admin.email}</p>
        </div>

        <div className="admin-profile-content">
          <ProfileInfo admin={admin} onAdminUpdated={setAdmin} />
        </div>
      </div>
    </>
  );
};

export default AdminProfile;
