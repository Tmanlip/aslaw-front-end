// src/components/ProfileInfo/ProfileInfo.tsx
import React, { useState } from "react";
import Pagination from "react-bootstrap/Pagination";
import ConfirmModal from "../../../../../../../components/Modals/ConfirmModal";
import ProfileDetailsPage from "./components/Profile1";
import ProfileStatusPage from "./components/Profile2";
import EditProfileModal from "./components/EditProfile";
import { resetUserPasswordAuto, updateUser } from "../../../../../../../hooks/user";
import { useClientData, User } from "../../../../../../../context/ClientDataContext";
import "./profileInfo.css";

const ProfileInfo: React.FC = () => {
  const { authUser, cases, setUserData } = useClientData();

  const [page, setPage] = useState(1);
  const [showEdit, setShowEdit] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // local editable user for the modal
  const [editableUser, setEditableUser] = useState<User>(authUser!);

  const [status, setStatus] = useState<"Active" | "Inactive" | "Archived">(
    (authUser?.status as "Active" | "Inactive" | "Archived") || "Active"
  );

  // Save status change
  const handleStatusSave = async (newStatus: "Active" | "Inactive" | "Archived") => {
    try {
      const updatedUser = { ...editableUser, status: newStatus };
      const response = await updateUser(editableUser.firmID, updatedUser);

      // Update context
      setUserData(response.user, cases);

      // Update local state
      setEditableUser(response.user);
    } catch (error: any) {
      throw error;
    }
  };

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
      if (updatedUser.status) setStatus(updatedUser.status as "Active" | "Inactive" | "Archived");

      setShowEdit(false);
      alert("Profile updated successfully!");
    } catch (error: any) {
      alert("Unable to update profile. Please try again.");
    }
  };

  const handleResetPassword = async () => {
    if (!editableUser?.firmID) {
      alert("Unable to reset password because user Firm ID is missing.");
      return;
    }

    setShowResetConfirm(true);
  };

  const confirmResetPassword = async () => {
    if (!editableUser?.firmID) {
      return;
    }

    try {
      setIsResetting(true);
      await resetUserPasswordAuto(editableUser.firmID);
      setShowResetConfirm(false);
      alert("Your new password was given and sent to the registered email.");
    } catch (error: any) {
      alert("Unable to reset password. Please try again.");
    } finally {
      setIsResetting(false);
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
            onStatusSave={handleStatusSave}
            onResetPassword={handleResetPassword}
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

      <ConfirmModal
        show={showResetConfirm}
        title="Reset Password"
        confirmText="Reset"
        confirmingText="Resetting..."
        isConfirming={isResetting}
        onConfirm={() => void confirmResetPassword()}
        onCancel={() => setShowResetConfirm(false)}
      >
        <p style={{ marginBottom: 0 }}>
          Reset password for {editableUser.name}? A new password will be emailed to {editableUser.email}.
        </p>
      </ConfirmModal>
    </>
  );
};

export default ProfileInfo;