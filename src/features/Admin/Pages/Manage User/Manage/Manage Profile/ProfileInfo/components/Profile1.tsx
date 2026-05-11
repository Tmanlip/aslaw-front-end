// src/components/ProfileInfo/ProfileDetailsPage.tsx
import React from "react";
import Button from "react-bootstrap/Button";
import { User } from "../../../../../../../../context/ClientDataContext";

interface ProfileDetailsPageProps {
  user: User;
  onEdit: () => void;
}

const ProfileDetailsPage: React.FC<ProfileDetailsPageProps> = ({
  user,
  onEdit,
}) => {
  return (
    <div className="admin-profile-page-card">
      <div className="admin-profile-page-header">
        <h4>Profile Information</h4>
        <p className="admin-profile-page-subtitle">Personal and account details</p>
      </div>

      <div className="admin-profile-field-list">
        <div className="admin-profile-field-item">
          <p className="admin-profile-field-label">Full Name</p>
          <p className="admin-profile-field-value">{user.name}</p>
        </div>

        {user.age && (
          <div className="admin-profile-field-item">
            <p className="admin-profile-field-label">Age</p>
            <p className="admin-profile-field-value">{user.age}</p>
          </div>
        )}

        {user.email && (
          <div className="admin-profile-field-item">
            <p className="admin-profile-field-label">Email</p>
            <p className="admin-profile-field-value">{user.email}</p>
          </div>
        )}

        {user.username && (
          <div className="admin-profile-field-item">
            <p className="admin-profile-field-label">Username</p>
            <p className="admin-profile-field-value">{user.username}</p>
          </div>
        )}

        {user.ICNumber && (
          <div className="admin-profile-field-item">
            <p className="admin-profile-field-label">IC Number</p>
            <p className="admin-profile-field-value">{user.ICNumber}</p>
          </div>
        )}

        {user.phoneNumber && (
          <div className="admin-profile-field-item">
            <p className="admin-profile-field-label">Phone Number</p>
            <p className="admin-profile-field-value">{user.phoneNumber}</p>
          </div>
        )}

        {user.HomeAddress && (
          <div className="admin-profile-field-item is-full">
            <p className="admin-profile-field-label">Home Address</p>
            <p className="admin-profile-field-value">{user.HomeAddress}</p>
          </div>
        )}

        {user.gender && (
          <div className="admin-profile-field-item">
            <p className="admin-profile-field-label">Gender</p>
            <p className="admin-profile-field-value">{user.gender}</p>
          </div>
        )}

        {user.maritalStatus && (
          <div className="admin-profile-field-item">
            <p className="admin-profile-field-label">Marital Status</p>
            <p className="admin-profile-field-value">{user.maritalStatus}</p>
          </div>
        )}
      </div>

      <div className="admin-profile-actions">
        <Button variant="primary" onClick={onEdit}>
          Edit Information
        </Button>
      </div>
    </div>
  );
};

export default ProfileDetailsPage;