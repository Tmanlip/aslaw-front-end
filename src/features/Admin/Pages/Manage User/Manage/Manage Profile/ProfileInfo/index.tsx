// src/components/ProfileInfo/ProfileInfo.tsx
import React, { useState } from "react";
import Pagination from "react-bootstrap/Pagination";
import ProfileDetailsPage from "./components/Profile1";
import ProfileStatusPage from "./components/Profile2";
import EditProfileModal from "./components/EditProfile";
import { updateUser } from "../../../../../../../hooks/user";
import { useClientData, User } from "../../../../../../../context/ClientDataContext";
import "./profileInfo.css";

const ProfileInfo: React.FC = () => {
  const { authUser, cases, setUserData } = useClientData();

  const [page, setPage] = useState(1);
  const [showEdit, setShowEdit] = useState(false);

  // local editable user for the modal
  const [editableUser, setEditableUser] = useState<User>(authUser!);

  const [status, setStatus] = useState<"Active" | "Inactive">(
    authUser?.status === "Inactive" ? "Inactive" : "Active"
  );

  // Save changes from modal
  const handleSave = async (updatedUser: User) => {
    try {
      // Call Laravel API
      const response = await updateUser(updatedUser.firmID, updatedUser);

      // Update context
      setUserData(response.user, cases);

      // Update local state
      setEditableUser(response.user);

      // Update status if changed
      if (updatedUser.status) setStatus(updatedUser.status as "Active" | "Inactive");

      setShowEdit(false);
      alert("Profile updated successfully!");
    } catch (error: any) {
      console.error("Failed to update profile:", error.response?.data || error);
      alert(error.response?.data?.message || "Failed to update profile.");
    }
  };

  if (!authUser) return <p>Loading user...</p>;

  return (
    <>
      <div className="admin-manage-profile-info-shell">
        {page === 1 && (
          <ProfileDetailsPage
            user={editableUser}
            onEdit={() => setShowEdit(true)}
          />
        )}

        {page === 2 && (
          <ProfileStatusPage
            user={editableUser}
            status={status}
            setStatus={setStatus}
            onEdit={() => setShowEdit(true)}
          />
        )}

        <Pagination className="admin-manage-profile-pagination">
          <Pagination.Item active={page === 1} onClick={() => setPage(1)}>
            1
          </Pagination.Item>
          <Pagination.Item active={page === 2} onClick={() => setPage(2)}>
            2
          </Pagination.Item>
        </Pagination>
      </div>

      <EditProfileModal
        show={showEdit}
        user={editableUser}
        onClose={() => setShowEdit(false)}
        onSave={handleSave} // sends full user to backend and updates context
      />
    </>
  );
};

export default ProfileInfo;