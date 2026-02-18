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
    <>
      <p>
        <strong>Full Name:</strong> {user.name}
      </p>

      {user.age && (
        <p>
          <strong>Age:</strong> {user.age}
        </p>
      )}

      {user.email && (
        <p>
          <strong>Email:</strong> {user.email}
        </p>
      )}

      {user.username && (
        <p>
          <strong>Username:</strong> {user.username}
        </p>
      )}

      {user.ICNumber && (
        <p>
          <strong>IC Number:</strong> {user.ICNumber}
        </p>
      )}

      {user.phoneNumber && (
        <p>
          <strong>Phone Number:</strong> {user.phoneNumber}
        </p>
      )}

      {user.HomeAddress && (
        <p>
          <strong>Home Address:</strong> {user.HomeAddress}
        </p>
      )}

      {user.gender && (
        <p>
          <strong>Gender:</strong> {user.gender}
        </p>
      )}

      {user.maritalStatus && (
        <p>
          <strong>Marital Status:</strong> {user.maritalStatus}
        </p>
      )}

      <div style={{ marginTop: "1rem" }}>
        <Button variant="primary" onClick={onEdit}>
          Edit Information
        </Button>
      </div>
    </>
  );
};

export default ProfileDetailsPage;